import { useState, useEffect, useCallback } from 'react'
// v3 - category + color status + deadline notification
import { auth, db } from './firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import {
  collection, addDoc, deleteDoc, updateDoc,
  doc, onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore'
import Auth from './Auth'
import './App.css'

const CATEGORIES = ['Tất cả', 'Công việc', 'Học tập', 'Cá nhân', 'Khác']

function toDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getDaysLeft(deadline) {
  if (!deadline) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dl = new Date(deadline)
  dl.setHours(0, 0, 0, 0)
  return Math.round((dl - today) / (1000 * 60 * 60 * 24))
}

function getDeadlineStatus(todo) {
  if (todo.completed) return 'completed'
  const days = getDaysLeft(todo.deadline)
  if (days === null) return ''
  if (days < 0) return 'overdue'       // đỏ
  if (days === 0) return 'due-today'   // vàng
  if (days <= 3) return 'due-soon'     // xanh lá
  return 'upcoming'
}

function formatDeadline(deadline) {
  if (!deadline) return null
  const [y, m, d] = deadline.split('-')
  return `${d}/${m}/${y}`
}

function DeadlineTag({ todo }) {
  const days = getDaysLeft(todo.deadline)
  if (days === null || todo.completed) return null

  let label = ''
  let cls = ''
  if (days < 0) { label = `Quá hạn ${Math.abs(days)} ngày`; cls = 'tag-overdue' }
  else if (days === 0) { label = 'Đến hạn hôm nay'; cls = 'tag-today' }
  else if (days <= 3) { label = `Còn ${days} ngày`; cls = 'tag-soon' }
  else { label = formatDeadline(todo.deadline); cls = 'tag-upcoming' }

  return <span className={`deadline-tag ${cls}`}>{label}</span>
}

export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [todos, setTodos] = useState([])
  const [input, setInput] = useState('')
  const [deadline, setDeadline] = useState('')
  const [category, setCategory] = useState('Công việc')
  const [filterDate, setFilterDate] = useState('all')
  const [filterCat, setFilterCat] = useState('Tất cả')
  const [notified, setNotified] = useState(new Set())

  const today = toDateStr(new Date())

  // Auth
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => { setUser(u); setAuthLoading(false) })
  }, [])

  // Firestore
  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'users', user.uid, 'todos'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, (snap) => {
      setTodos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
  }, [user])

  // Deadline notifications
  const checkNotifications = useCallback(() => {
    if (!('Notification' in window)) return
    todos.forEach((todo) => {
      if (todo.completed || notified.has(todo.id)) return
      const days = getDaysLeft(todo.deadline)
      if (days === null) return

      let msg = null
      if (days < 0) msg = `⛔ "${todo.text}" đã quá hạn ${Math.abs(days)} ngày!`
      else if (days === 0) msg = `🔔 "${todo.text}" đến hạn hôm nay!`
      else if (days === 1) msg = `⚠️ "${todo.text}" còn 1 ngày nữa là đến hạn!`

      if (msg) {
        if (Notification.permission === 'granted') {
          new Notification('Task Manager', { body: msg, icon: '/favicon.ico' })
          setNotified((prev) => new Set([...prev, todo.id]))
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then((perm) => {
            if (perm === 'granted') {
              new Notification('Task Manager', { body: msg, icon: '/favicon.ico' })
              setNotified((prev) => new Set([...prev, todo.id]))
            }
          })
        }
      }
    })
  }, [todos, notified])

  useEffect(() => {
    checkNotifications()
    const interval = setInterval(checkNotifications, 60 * 60 * 1000) // mỗi 1 giờ
    return () => clearInterval(interval)
  }, [checkNotifications])

  const addTodo = async () => {
    const trimmed = input.trim()
    if (!trimmed) return
    await addDoc(collection(db, 'users', user.uid, 'todos'), {
      text: trimmed,
      completed: false,
      deadline: deadline || null,
      category: category,
      createdAt: serverTimestamp(),
    })
    setInput('')
    setDeadline('')
  }

  const toggleTodo = async (id, completed) => {
    await updateDoc(doc(db, 'users', user.uid, 'todos', id), { completed: !completed })
  }

  const deleteTodo = async (id) => {
    await deleteDoc(doc(db, 'users', user.uid, 'todos', id))
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter') addTodo() }

  // Filter
  const filteredTodos = todos.filter((t) => {
    const days = getDaysLeft(t.deadline)
    const dateOk =
      filterDate === 'all' ? true :
      filterDate === 'today' ? days === 0 :
      filterDate === 'upcoming' ? (days !== null && days > 0) :
      filterDate === 'overdue' ? (!t.completed && days !== null && days < 0) :
      true
    const catOk = filterCat === 'Tất cả' || t.category === filterCat
    return dateOk && catOk
  })

  // Stats
  const completedCount = todos.filter((t) => t.completed).length
  const totalCount = todos.length
  const remaining = totalCount - completedCount
  const overdueCount = todos.filter((t) => !t.completed && getDaysLeft(t.deadline) !== null && getDaysLeft(t.deadline) < 0).length
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)

  if (authLoading) return <div className="loading-screen"><p>Đang tải...</p></div>
  if (!user) return <Auth />

  return (
    <div className="app">
      {/* Header */}
      <div className="app-header">
        <div>
          <h1>📋 Task Manager</h1>
          <p className="summary">
            {remaining} task còn lại
            {overdueCount > 0 && <span className="overdue-badge">🔴 {overdueCount} quá hạn</span>}
          </p>
        </div>
        <div className="user-info">
          <span>{user.email}</span>
          <button className="logout-btn" onClick={() => signOut(auth)}>Đăng xuất</button>
        </div>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="progress-section">
          <div className="progress-header">
            <span>Tiến độ</span>
            <span className="progress-fraction">{completedCount}/{totalCount} task</span>
          </div>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <div className="progress-percent">{progressPercent}%</div>
        </div>
      )}

      {/* Input */}
      <div className="input-section">
        <div className="input-row">
          <input
            type="text"
            placeholder="Tên task..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Tên task"
          />
          <button onClick={addTodo}>Thêm</button>
        </div>
        <div className="input-meta-row">
          <div className="deadline-row">
            <label htmlFor="deadline">📅 Deadline:</label>
            <input
              id="deadline"
              type="date"
              value={deadline}
              min={today}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          <div className="category-row">
            <label htmlFor="category">🏷️ Danh mục:</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.filter((c) => c !== 'Tất cả').map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="cat-filter-row">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={filterCat === c ? 'active' : ''}
            onClick={() => setFilterCat(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Date filter */}
      <div className="filter-row">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'today', label: '🟡 Hôm nay' },
          { key: 'upcoming', label: '🟢 Sắp tới' },
          { key: 'overdue', label: '🔴 Quá hạn' },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={filterDate === key ? 'active' : ''}
            onClick={() => setFilterDate(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Task list */}
      <ul className="todo-list">
        {filteredTodos.length === 0 && (
          <li className="empty">
            {filterDate === 'today' && 'Không có task nào hôm nay.'}
            {filterDate === 'upcoming' && 'Không có task nào sắp tới.'}
            {filterDate === 'overdue' && '🎉 Không có task nào quá hạn!'}
            {filterDate === 'all' && 'Chưa có task nào. Thêm task đầu tiên đi!'}
          </li>
        )}
        {filteredTodos.map((todo) => {
          const status = getDeadlineStatus(todo)
          return (
            <li key={todo.id} className={`task-item status-${status}`}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id, todo.completed)}
                aria-label={`Đánh dấu "${todo.text}"`}
              />
              <div className="task-content">
                <div className="task-top">
                  <span className="task-text">{todo.text}</span>
                  {todo.category && (
                    <span className="category-badge">{todo.category}</span>
                  )}
                </div>
                <DeadlineTag todo={todo} />
              </div>
              <button
                className="delete"
                onClick={() => deleteTodo(todo.id)}
                aria-label={`Xóa "${todo.text}"`}
              >✕</button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
