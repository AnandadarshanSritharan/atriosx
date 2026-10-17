import React, { useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const { data: settings } = useSettings();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const hours = settings?.businessHours || {
    monday: { open: '10:00', close: '23:00', closed: false },
    tuesday: { open: '10:00', close: '23:00', closed: false },
    wednesday: { open: '10:00', close: '23:00', closed: false },
    thursday: { open: '10:00', close: '23:00', closed: false },
    friday: { open: '10:00', close: '00:00', closed: false },
    saturday: { open: '09:00', close: '00:00', closed: false },
    sunday: { open: '09:00', close: '23:00', closed: false },
  };

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', paddingTop: '96px' }}>
      <div className="py-12 px-4 max-w-7xl mx-auto space-y-16">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <span className="text-xs uppercase tracking-widest text-silver font-semibold">Location & Inquiries</span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">VISIT ATRIOS</h1>
        <p className="text-muted text-base">
          Experience Sri Lanka's premium gaming lounge in person. Walk-ins are always welcome, or reserve your slot online with zero deposit.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact Info & Hours */}
        <div className="space-y-8">
          <div className="card-premium p-8 space-y-6">
            <h3 className="text-xl font-bold text-white">Lounge Details</h3>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-silver flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Address</div>
                  <div className="text-muted">{settings?.address || 'No. 45, Galle Road, Colombo 03, Sri Lanka'}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-silver flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Phone / WhatsApp</div>
                  <div className="text-muted">{settings?.phone || '+94 77 123 4567'}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-silver flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Email Inquiries</div>
                  <div className="text-muted">{settings?.email || 'info@atriosentertainment.com'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Operating Hours Table */}
          <div className="card-premium p-8 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-2">
              <Clock className="w-5 h-5 text-silver" /> Operating Hours
            </div>

            <div className="divide-y divide-border text-sm">
              {Object.entries(hours).map(([day, val]: [string, any]) => (
                <div key={day} className="py-2.5 flex justify-between items-center">
                  <span className="capitalize text-silver-light font-medium">{day}</span>
                  {val.closed ? (
                    <span className="text-red-400 font-semibold text-xs uppercase">Closed</span>
                  ) : (
                    <span className="font-mono text-muted text-xs">
                      {val.open} — {val.close}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enquiry Form */}
        <div className="card-premium p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Send an Enquiry</h3>
            <p className="text-sm text-muted mb-6">
              Have questions regarding private tournament bookings, corporate packages, or birthday parties? Leave us a message.
            </p>

            {submitted ? (
              <div className="bg-green-950/30 border border-green-800/40 p-6 rounded-xl text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
                <h4 className="text-lg font-bold text-white">Message Received</h4>
                <p className="text-sm text-silver">Thank you, {form.name}! Our team will get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-silver uppercase mb-1 block">Your Name *</label>
                  <Input
                    required
                    placeholder="John Perera"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-silver uppercase mb-1 block">Phone *</label>
                    <Input
                      required
                      placeholder="077XXXXXXX"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-silver uppercase mb-1 block">Email</label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-silver uppercase mb-1 block">Message *</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-silver"
                    placeholder="Tell us about your event, tournament request, or general inquiry..."
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                  />
                </div>

                <Button type="submit" className="w-full flex items-center justify-center gap-2 mt-4">
                  <Send className="w-4 h-4" /> Send Message
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
