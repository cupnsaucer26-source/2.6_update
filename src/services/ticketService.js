import axios from 'axios'

// Support tickets live on the server (/api/tickets). The server decides who
// sees what from the signed-in account: admins every ticket, employees their
// own plus the unassigned queue (scoped to their store), farmers only their own tickets.

function notifyUpdated(ticket) {
  window.dispatchEvent(new CustomEvent('sathyam:tickets-updated', { detail: ticket }))
}

function unwrap(res, fallbackMessage) {
  if (!res?.data?.success) throw new Error(res?.data?.message || fallbackMessage)
  return res.data.data
}

export const ticketService = {
  // Filtering by role happens on the server; the arguments are kept so the
  // pages' calls stay unchanged.
  async getTickets() {
    const res = await axios.get('/api/tickets')
    const list = unwrap(res, 'Unable to fetch tickets')
    return Array.isArray(list) ? list : []
  },

  // Single ticket fetch by ID
  async getTicketById(ticketId) {
    const res = await axios.get(`/api/tickets/${encodeURIComponent(ticketId)}`)
    return unwrap(res, 'Unable to fetch ticket')
  },

  // Upload ticket attachment (PNG, JPEG, WebP, max 5MB)
  async uploadAttachment(file) {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    const res = await axios.post('/api/tickets/upload', {
      filename: file.name,
      contentType: file.type || 'image/jpeg',
      data: base64
    })
    return unwrap(res, 'Failed to upload attachment')
  },

  // Create a new support ticket, optionally linked to one of the farmer's orders
  async createTicket({ orderId, farmerName, phone, crop, category, priority = 'Medium', subject, description, orderItems = [], attachment = null }) {
    const res = await axios.post('/api/tickets', { orderId, farmerName, phone, crop, category, priority, subject, description, orderItems, attachment })
    const ticket = unwrap(res, 'Failed to submit support ticket')
    notifyUpdated(ticket)
    return ticket
  },

  // Super Admin assigns to an admin of the ticket's store (storeId); a store
  // admin hands it to their own staff. Rules: server/ticketRouting.js.
  async assignTicket(ticketId, { assignedToId, storeId }) {
    const res = await axios.put(`/api/tickets/${encodeURIComponent(ticketId)}/assign`, { assignedToId, storeId })
    const ticket = unwrap(res, 'Could not assign ticket')
    notifyUpdated(ticket)
    return ticket
  },

  // Status: Open, In Progress, Pending, Resolved, Closed, Rejected
  async updateTicketStatus(ticketId, status) {
    const res = await axios.put(`/api/tickets/${encodeURIComponent(ticketId)}/status`, { status })
    const ticket = unwrap(res, 'Could not update status')
    notifyUpdated(ticket)
    return ticket
  },

  // Priority: Low, Medium, High, Urgent (Staff / Admin only)
  async updateTicketPriority(ticketId, priority) {
    const res = await axios.put(`/api/tickets/${encodeURIComponent(ticketId)}/priority`, { priority })
    const ticket = unwrap(res, 'Could not update priority')
    notifyUpdated(ticket)
    return ticket
  },

  // Sender name and role come from the signed-in account on the server.
  // Staff can flag isInternal: true to keep note private from customer.
  async addReply(ticketId, { text, isInternal = false, attachment = null }) {
    const res = await axios.post(`/api/tickets/${encodeURIComponent(ticketId)}/replies`, { text, isInternal, attachment })
    const ticket = unwrap(res, 'Could not send reply')
    notifyUpdated(ticket)
    return ticket
  }
}
