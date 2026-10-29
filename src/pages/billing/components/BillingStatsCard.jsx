import React from 'react'
import { formatBillingStats } from '../../../shared/billingInvoices'

export { formatBillingStats }

/**
 * BillingStatsCard - Displays today's POS metrics: Today's Sales, Invoices Today, GST Tax Collected.
 *
 * @param {object} props
 * @param {object} [props.todayStats] - Statistics object { sales, transactions, gst }
 */
export default function BillingStatsCard({ todayStats }) {
  const { salesFormatted, transactionsFormatted, gstFormatted } = formatBillingStats(todayStats)

  return (
    <div className="stat-grid" style={{ marginBottom: 24 }}>
      <div className="stat-card green">
        <div className="stat-value" style={{ fontSize: '1.4rem', color: '#34d399' }}>
          {salesFormatted}
        </div>
        <div className="stat-label">Today&apos;s Sales</div>
      </div>
      <div className="stat-card blue">
        <div className="stat-value" style={{ fontSize: '1.4rem', color: '#60a5fa' }}>
          {transactionsFormatted}
        </div>
        <div className="stat-label">Invoices Today</div>
      </div>
      <div className="stat-card purple">
        <div className="stat-value" style={{ fontSize: '1.4rem', color: '#a78bfa' }}>
          {gstFormatted}
        </div>
        <div className="stat-label">GST Tax Collected</div>
      </div>
    </div>
  )
}
