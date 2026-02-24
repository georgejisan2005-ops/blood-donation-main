import { useState } from 'react'
import { adminService } from '../../services/admin.service'
import toast from 'react-hot-toast'

function AdminAnnouncements() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState('medium')
  const [targetRole, setTargetRole] = useState('all')
  const [sending, setSending] = useState(false)

  const send = async () => {
    try {
      setSending(true)
      await adminService.sendAnnouncement({ title, message, priority, targetRole })
      toast.success('Announcement sent')
      setTitle(''); setMessage('')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to send announcement')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="container py-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Send Alerts and Notifications</h2>
      <div className="card">
        <div className="card-body space-y-3">
          <input className="input" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
          <textarea className="input" placeholder="Message" rows={6} value={message} onChange={e => setMessage(e.target.value)} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select className="input" value={priority} onChange={e => setPriority(e.target.value)}>
              {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select className="input" value={targetRole} onChange={e => setTargetRole(e.target.value)}>
              {['all', 'donor', 'recipient'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button disabled={sending} className={`btn ${sending ? 'opacity-75' : ''}`} onClick={send}>
              {sending ? 'Sending...' : 'Send Announcement'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminAnnouncements


