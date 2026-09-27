import { Bot, Leaf, MessageCircle, Send, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import api from '../../api'

const quickPrompts = ['What is fresh today?', 'When is the next market?', 'How does pickup work?']

const answer = (question) => {
  const query = question.toLowerCase()
  const db = api.snapshot()
  if (query.includes('fresh') || query.includes('stock') || query.includes('available')) {
    const items = db.products.filter((item) => item.available && item.stock > 0).slice(0, 3).map((item) => `${item.name} (${item.stock} left)`).join(', ')
    return `Fresh right now: ${items}. You can reserve any of these from the produce page.`
  }
  if (query.includes('market') || query.includes('when') || query.includes('time')) {
    const market = db.markets[0]
    return `The next market is ${market.name} on ${market.day}, ${market.date}, from ${market.hours}.`
  }
  if (query.includes('pickup') || query.includes('pay')) return 'Reserve online, choose a pickup window, then collect from the farmer’s stall. Payment is made in person—there is no online payment.'
  if (query.includes('tomato')) return 'Willow & Root Farm has heirloom tomatoes in stock for Liberty Harvest Market and the DHA evening market.'
  return 'I can help with produce availability, market schedules, farmer locations, and pickup. Try asking what is fresh today.'
}

export default function AIChatbot() {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [messages, setMessages] = useState([{ from: 'bot', text: 'Hi, I’m Sprout. Looking for something fresh?' }])
  const send = (value = text) => {
    const clean = value.trim()
    if (!clean) return
    setMessages((current) => [...current, { from: 'user', text: clean }, { from: 'bot', text: answer(clean) }])
    setText('')
  }
  return (
    <div className="chatbot">
      {open && <section className="chat-panel" aria-label="MarketLink assistant"><header><span><Bot /></span><div><b>Ask Sprout</b><small><i /> Local market assistant</small></div><button onClick={() => setOpen(false)} aria-label="Close assistant"><X /></button></header><div className="chat-messages">{messages.map((message, index) => <div key={index} className={`chat-message chat-message--${message.from}`}>{message.from === 'bot' && <Leaf />}<p>{message.text}</p></div>)}</div>{messages.length < 3 && <div className="quick-prompts">{quickPrompts.map((prompt) => <button key={prompt} onClick={() => send(prompt)}><Sparkles />{prompt}</button>)}</div>}<form onSubmit={(event) => { event.preventDefault(); send() }}><input aria-label="Ask about markets or produce" value={text} onChange={(event) => setText(event.target.value)} placeholder="Ask about markets or produce…" /><button aria-label="Send"><Send /></button></form></section>}
      <button className="chat-toggle" onClick={() => setOpen((value) => !value)} aria-label="Open AI market assistant">{open ? <X /> : <MessageCircle />}<span>Ask Sprout</span></button>
    </div>
  )
}
