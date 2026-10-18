import React, { useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { Button } from '../../components/ui/button';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { validateName, validatePhone, validateEmail, validateMessage } from '../../utils/validation';

export default function ContactPage() {
  const { data: settings } = useSettings();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const validateField = (field: string, value: string) => {
    let error: string | null = null;
    switch (field) {
      case 'name':
        error = validateName(value);
        break;
      case 'phone':
        error = validatePhone(value);
        break;
      case 'email':
        error = validateEmail(value, false);
        break;
      case 'message':
        error = validateMessage(value, 10, 1000);
        break;
    }
    setErrors(prev => ({ ...prev, [field]: error }));
    return error;
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, (form as any)[field]);
  };

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields touched
    setTouched({ name: true, phone: true, email: true, message: true });

    const nameErr = validateName(form.name);
    const phoneErr = validatePhone(form.phone);
    const emailErr = validateEmail(form.email, false);
    const messageErr = validateMessage(form.message, 10, 1000);

    const newErrors = {
      name: nameErr,
      phone: phoneErr,
      email: emailErr,
      message: messageErr,
    };
    setErrors(newErrors);

    // If any error exists, block submission
    if (nameErr || phoneErr || emailErr || messageErr) {
      return;
    }

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

  const getInputStyle = (field: string) => {
    const isErr = touched[field] && Boolean(errors[field]);
    const isValid = touched[field] && !errors[field] && Boolean((form as any)[field]);
    return {
      width: '100%',
      padding: '10px 14px',
      background: '#111111',
      border: `1px solid ${isErr ? '#ef4444' : isValid ? '#22c55e60' : '#2a2a2a'}`,
      borderRadius: '8px',
      color: '#ffffff',
      fontSize: '0.88rem',
      outline: 'none',
      transition: 'border-color 0.15s',
    };
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
                    <div className="text-muted">{settings?.address || 'No. 146, Nursing Home Road, Hatton, Sri Lanka'}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-silver flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white">Phone / WhatsApp</div>
                    <div className="text-muted">{settings?.phone || '051 222 3132'}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-silver flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white">Email Inquiries</div>
                    <div className="text-muted">{settings?.email || 'atriosentertainment@gmail.com'}</div>
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
                <div className="bg-green-950/30 border border-green-800/40 p-8 rounded-xl text-center space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
                  <h4 className="text-lg font-bold text-white">Message Received!</h4>
                  <p className="text-sm text-silver">
                    Thank you, <strong className="text-white">{form.name}</strong>! Our team has received your enquiry and will contact you via {form.phone} shortly.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ name: '', phone: '', email: '', message: '' });
                      setTouched({});
                      setErrors({});
                    }}
                    className="mt-4"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  {/* Name Field */}
                  <div>
                    <label className="text-xs font-semibold text-silver uppercase mb-1 block">
                      Your Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      placeholder="e.g. John Perera"
                      value={form.name}
                      onChange={e => handleChange('name', e.target.value)}
                      onBlur={() => handleBlur('name')}
                      style={getInputStyle('name')}
                    />
                    {touched.name && errors.name && (
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-red-400 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{errors.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Phone Field */}
                    <div>
                      <label className="text-xs font-semibold text-silver uppercase mb-1 block">
                        Phone Number <span className="text-red-400">*</span>
                      </label>
                      <input
                        placeholder="077 XXX XXXX"
                        value={form.phone}
                        onChange={e => handleChange('phone', e.target.value)}
                        onBlur={() => handleBlur('phone')}
                        style={getInputStyle('phone')}
                      />
                      {touched.phone && errors.phone && (
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-red-400 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{errors.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Email Field */}
                    <div>
                      <label className="text-xs font-semibold text-silver uppercase mb-1 block">
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        placeholder="john@example.com"
                        value={form.email}
                        onChange={e => handleChange('email', e.target.value)}
                        onBlur={() => handleBlur('email')}
                        style={getInputStyle('email')}
                      />
                      {touched.email && errors.email && (
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-red-400 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{errors.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message Field */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-silver uppercase">
                        Message <span className="text-red-400">*</span>
                      </label>
                      <span className="text-[11px] text-muted font-mono">
                        {form.message.length}/1000
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      placeholder="Tell us about your event, tournament request, or general inquiry (at least 10 characters)..."
                      value={form.message}
                      onChange={e => handleChange('message', e.target.value)}
                      onBlur={() => handleBlur('message')}
                      style={{
                        ...getInputStyle('message'),
                        resize: 'vertical',
                      }}
                    />
                    {touched.message && errors.message && (
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-red-400 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{errors.message}</span>
                      </div>
                    )}
                  </div>

                  <Button type="submit" className="w-full flex items-center justify-center gap-2 mt-4 font-bold">
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
