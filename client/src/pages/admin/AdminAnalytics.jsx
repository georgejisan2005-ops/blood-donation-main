import { useEffect, useState } from 'react'
import { adminService } from '../../services/admin.service'
import toast from 'react-hot-toast'

function AdminAnalytics() {
  const [period, setPeriod] = useState('30')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      const data = await adminService.getAnalytics(period)
      setData(data)
    } catch {
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  return (
    <div className="container py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Reports & Analytics</h2>
        <div className="flex items-center gap-2">
          <select className="input" value={period} onChange={e => setPeriod(e.target.value)}>
            {['7', '14', '30', '60', '90'].map(p => <option key={p} value={p}>{p} days</option>)}
          </select>
          <button className="btn" onClick={fetchData}>Refresh</button>
        </div>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <div className="card-header"><h3 className="font-semibold">Top Blood Groups</h3></div>
            <div className="card-body space-y-2">
              {data?.topBloodGroups?.map((g) => (
                <div className="flex items-center justify-between" key={g._id}>
                  <span>{g._id}</span>
                  <span className="text-gray-600 text-sm">{g.count}</span>
                </div>
              )) || <div className="text-gray-500">No data</div>}
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3 className="font-semibold">Success Rate by Group</h3></div>
            <div className="card-body space-y-2">
              {data?.successRates?.map((s) => (
                <div className="flex items-center justify-between" key={s._id}>
                  <span>{s._id}</span>
                  <span className="text-gray-600 text-sm">{s.successRate.toFixed(1)}%</span>
                </div>
              )) || <div className="text-gray-500">No data</div>}
            </div>
          </div>
          <div className="card md:col-span-2">
            <div className="card-header"><h3 className="font-semibold">Daily Trends (Users/Requests)</h3></div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Users</h4>
                  <div className="space-y-1 max-h-64 overflow-auto">
                    {data?.userTrends?.map(t => (
                      <div key={`${t._id.date}-${t._id.role}`} className="flex items-center justify-between text-sm">
                        <span>{t._id.date} • {t._id.role}</span>
                        <span>{t.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Requests</h4>
                  <div className="space-y-1 max-h-64 overflow-auto">
                    {data?.requestTrends?.map(t => (
                      <div key={`${t._id.date}-${t._id.status}`} className="flex items-center justify-between text-sm">
                        <span>{t._id.date} • {t._id.status}</span>
                        <span>{t.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminAnalytics


