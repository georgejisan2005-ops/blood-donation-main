import { useEffect, useState } from 'react'
import { adminService } from '../../services/admin.service'
import toast from 'react-hot-toast'

function AdminDonors() {
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [filters, setFilters] = useState({ bloodGroup: '', city: '', isVerified: '' })

  const fetchDonors = async (nextPage = page) => {
    try {
      setLoading(true)
      const params = { page: nextPage, limit: 10 }
      if (filters.bloodGroup) params.bloodGroup = filters.bloodGroup
      if (filters.city) params.city = filters.city
      if (filters.isVerified !== '') params.isVerified = filters.isVerified
      const data = await adminService.getDonors(params)
      setDonors(data.donors)
      setPages(data.pagination.pages)
      setPage(data.pagination.current)
    } catch (error) {
      toast.error('Failed to load donors')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDonors(1) }, [])

  const setVerified = async (donorId, isVerified) => {
    try {
      await adminService.verifyDonor(donorId, !isVerified)
      toast.success(`Donor ${!isVerified ? 'verified' : 'unverified'}`)
      fetchDonors(page)
    } catch {
      toast.error('Failed to update donor verification')
    }
  }

  return (
    <div className="container py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Verify Donors</h2>
        <div className="flex gap-2">
          <select
            className="input"
            value={filters.bloodGroup}
            onChange={(e) => setFilters(v => ({ ...v, bloodGroup: e.target.value }))}
          >
            <option value="">All Groups</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <input
            className="input"
            placeholder="City"
            value={filters.city}
            onChange={(e) => setFilters(v => ({ ...v, city: e.target.value }))}
          />
          <select
            className="input"
            value={filters.isVerified}
            onChange={(e) => setFilters(v => ({ ...v, isVerified: e.target.value }))}
          >
            <option value="">All</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
          <button className="btn" onClick={() => fetchDonors(1)}>Filter</button>
        </div>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Blood Group</th>
                    <th>City</th>
                    <th>Verified</th>
                    <th>Available</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {donors.map(d => (
                    <tr key={d._id}>
                      <td>{d.user?.name || '-'}</td>
                      <td>{d.bloodGroup}</td>
                      <td>{d.location?.city || '-'}</td>
                      <td>{d.isVerified ? 'Yes' : 'No'}</td>
                      <td>{d.isAvailable ? 'Yes' : 'No'}</td>
                      <td>
                        <button className={`btn ${d.isVerified ? 'btn-danger' : 'btn-success'}`} onClick={() => setVerified(d._id, d.isVerified)}>
                          {d.isVerified ? 'Unverify' : 'Verify'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4">
              <button className="btn" disabled={page <= 1} onClick={() => fetchDonors(page - 1)}>Prev</button>
              <span className="text-sm text-gray-600">Page {page} of {pages}</span>
              <button className="btn" disabled={page >= pages} onClick={() => fetchDonors(page + 1)}>Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDonors


