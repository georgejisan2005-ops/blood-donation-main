import { useEffect, useMemo, useState } from 'react'
import { adminService } from '../../services/admin.service'
import toast from 'react-hot-toast'
import '../../styles/admin.css'

function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [isFiltering, setIsFiltering] = useState(false)

  const fetchUsers = async (nextPage = page) => {
    try {
      setLoading(true)
      const params = { page: nextPage, limit: 10 }
      if (search) params.search = search
      if (role) params.role = role
      const data = await adminService.getUsers(params)
      // Exclude admin users from listing
      setUsers((data.users || []).filter(u => u.role !== 'admin'))
      setPages(data.pagination.pages)
      setPage(data.pagination.current)
    } catch (error) {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers(1) }, [])

  const toggleActive = async (userId, isActive) => {
    try {
      await adminService.updateUserStatus(userId, !isActive)
      toast.success(`User ${!isActive ? 'activated' : 'deactivated'}`)
      fetchUsers(page)
    } catch {
      toast.error('Failed to update user status')
    }
  }

  // Debounced search for a smoother feel
  const debouncedSearch = useMemo(() => {
    let t
    return (value) => {
      setSearch(value)
      clearTimeout(t)
      setIsFiltering(true)
      t = setTimeout(() => {
        fetchUsers(1)
        setIsFiltering(false)
      }, 400)
    }
  }, [])

  return (
    <div className="container admin-page">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h2 className="admin-title">Manage Users</h2>
          <p className="admin-subtitle">Search, filter, and update user status</p>
        </div>
        <div className="actions-row">
          <button className="btn" onClick={() => fetchUsers(1)}>
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
 <div className="card admin-filters">
  <div className="card-body">
    <div className="admin-filters-grid">
      <div>
        <input
          defaultValue={search}
          onChange={(e) => debouncedSearch(e.target.value)}
          placeholder="Search name, email, department"
          className="admin-filter-input"
        />
        {isFiltering && <div className="admin-contact-phone" style={{ marginTop: '0.25rem' }}>Filtering…</div>}
      </div>
      <div>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="admin-filter-input">
          <option value="">All Roles</option>
          <option value="donor">Donor</option>
          <option value="recipient">Recipient</option>
        </select>
      </div>
      <div className="actions-row">
        <button className="btn" onClick={() => fetchUsers(1)}>Apply</button>
        <button className="btn" onClick={() => { setRole(''); setSearch(''); fetchUsers(1) }}>Reset</button>
      </div>
    </div>
  </div>
</div>


      {/* List */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="admin-skeleton-list">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="admin-skeleton-item" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="admin-empty-state">
              <div className="admin-empty-emoji">😕</div>
              <p className="admin-empty-title">No users found</p>
              <p className="admin-empty-subtitle">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Contact</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const initials = (u.name || '?')
                      .split(' ')
                      .map(s => s[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()
                    return (
                      <tr key={u._id}>
                        <td>
                          <div className="admin-user-cell">
                            <div className="admin-avatar">
                              {initials}
                            </div>
                            <div>
                              <div className="admin-user-name">{u.name}</div>
                              <div className="admin-user-id">ID: {u._id.slice(-6)}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="admin-contact-email">{u.email}</div>
                          <div className="admin-contact-phone">{u.phone || '-'}</div>
                        </td>
                        <td>
                          <span className={`badge role-${u.role}`}>{u.role}</span>
                        </td>
                        <td>{u.department || '-'}</td>
                        <td>
                          <span className={`badge ${u.isActive ? 'badge-success' : 'badge-error'}`}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="actions-row end">
                            <button className={`btn ${u.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleActive(u._id, u.isActive)}>
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="admin-pagination">
            <button className="btn" disabled={page <= 1} onClick={() => fetchUsers(page - 1)}>Prev</button>
            <span className="admin-page-info">Page {page} of {pages}</span>
            <button className="btn" disabled={page >= pages} onClick={() => fetchUsers(page + 1)}>Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminUsers


