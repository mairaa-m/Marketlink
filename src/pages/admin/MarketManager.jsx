import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import api from '../../api'
const empty = { name: '', address: '', day: '', openingTime: '08:00', closingTime: '13:00', lat: '', lng: '' }
const defaultTimes = { 'm-1': ['08:00', '13:00'], 'm-2': ['09:00', '14:00'], 'm-3': ['16:00', '20:00'] }
export default function MarketManager({ markets, onChange }) {
  const [form, setForm] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const save = (event) => {
    event.preventDefault()
    try { api.markets.save({ ...form, lat: Number(form.lat), lng: Number(form.lng) }); onChange(); setForm(null); toast.success('Market saved') } catch (error) { toast.error(error.message) }
  }
  return <section className="portal-panel"><button className="btn" onClick={() => setForm({ ...empty })}>Add Market</button>{form && <form className="dashboard-edit-form" onSubmit={save}><h2>{form.id ? 'Edit Market' : 'Add Market'}</h2><div className="form-grid">{[['name', 'Market Name', 'text'], ['address', 'Address', 'text'], ['day', 'Operating Days', 'text'], ['openingTime', 'Opening Time', 'time'], ['closingTime', 'Closing Time', 'time'], ['lat', 'Latitude', 'number'], ['lng', 'Longitude', 'number']].map(([key, label, type]) => <label key={key}>{label}<input required type={type} step={type === 'number' ? 'any' : undefined} min={key === 'lat' ? -90 : key === 'lng' ? -180 : undefined} max={key === 'lat' ? 90 : key === 'lng' ? 180 : undefined} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></label>)}</div><button className="btn">Save Market</button><button className="text-btn" type="button" onClick={() => setForm(null)}>Cancel</button></form>}
    {deleting && <div className="dashboard-confirm" role="alert"><h3>Delete {deleting.name}?</h3><p>This removes the market from listings and farmer pickup choices. Historical orders are kept. Markets with active pickups cannot be deleted.</p><button className="btn" onClick={() => { try { api.markets.remove(deleting.id); onChange(); setDeleting(null); toast.success('Market deleted') } catch (error) { toast.error(error.message) } }}>Confirm Delete</button><button className="text-btn" onClick={() => setDeleting(null)}>Cancel</button></div>}
    <div className="table-wrap"><table><thead><tr><th>Market</th><th>Operating Days</th><th>Hours</th><th>Address</th><th>Actions</th></tr></thead><tbody>{markets.map((market) => <tr key={market.id}><td>{market.name}</td><td>{market.day}</td><td>{market.hours}</td><td>{market.address}</td><td><div className="table-actions"><Link to={`/markets/${market.id}`}>View</Link><button onClick={() => setForm({ ...market, openingTime: market.openingTime || defaultTimes[market.id]?.[0] || '08:00', closingTime: market.closingTime || defaultTimes[market.id]?.[1] || '13:00' })}>Edit</button><button onClick={() => setDeleting(market)}>Delete</button></div></td></tr>)}</tbody></table></div>
  </section>
}
