import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Avatar, Button } from '../shared/UI';

const MOCK_STUDENTS = [
  { id: '101', name: 'Ahmed Khaled', email: 'ahmed.k@school.edu', grade: 'Grade 10', groups: ['Math 101', 'Physics A'], avgGrade: 92, attendance: 98, status: 'Active', guardian: '+20 100 123 4567' },
  { id: '102', name: 'Sara Youssef', email: 'sara.y@school.edu', grade: 'Grade 10', groups: ['Chemistry Basics'], avgGrade: 88, attendance: 95, status: 'Active', guardian: '+20 114 987 6543' },
  { id: '103', name: 'Omar Tarek', email: 'omar.t@school.edu', grade: 'Grade 11', groups: ['Math 101'], avgGrade: 65, attendance: 72, status: 'At Risk', guardian: '+20 155 555 1234' },
  { id: '104', name: 'Laila Mahmoud', email: 'laila.m@school.edu', grade: 'Grade 12', groups: ['Advanced Calculus'], avgGrade: 96, attendance: 100, status: 'Active', guardian: '+20 122 345 6789' },
  { id: '105', name: 'Kareem Hassan', email: 'kareem.h@school.edu', grade: 'Grade 10', groups: ['Physics A', 'Chemistry Basics'], avgGrade: 74, attendance: 85, status: 'Monitor', guardian: '+20 101 444 8888' },
];

export default function StudentsOverview() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterObj, setFilterObj] = useState('All');

  const filtered = MOCK_STUDENTS.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                        s.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterObj === 'All' ? true : s.status === filterObj;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '10px 0' }}>
      
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>All Students</h2>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>Manage your centralized roster, view risk assessments, and contact guardians.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="secondary" onClick={() => {}}>Export CSV</Button>
          <Button onClick={() => {}}>+ Invite Student</Button>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 16, top: 12, color: 'var(--text4)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input 
            type="text" 
            placeholder="Search by student name or email..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ 
              width: '100%', padding: '10px 16px 10px 42px', 
              background: 'var(--ink2)', border: '1px solid transparent', 
              borderRadius: 12, fontSize: 13, fontWeight: 500, color: 'var(--text)',
              transition: 'all 0.2s'
            }}
            onFocus={e => { e.target.style.background = 'var(--surface)'; e.target.style.borderColor = 'var(--primary-300)'; }}
            onBlur={e => { e.target.style.background = 'var(--ink2)'; e.target.style.borderColor = 'transparent'; }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['All', 'Active', 'Monitor', 'At Risk'].map(f => (
            <button key={f}
              onClick={() => setFilterObj(f)}
              style={{
                padding: '8px 16px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                background: filterObj === f ? 'var(--text)' : 'transparent',
                color: filterObj === f ? '#fff' : 'var(--text3)',
                border: `1px solid ${filterObj === f ? 'var(--text)' : 'var(--border2)'}`,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Master Data Table ── */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--surface3)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student</th>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Groups</th>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Performance</th>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Guardian</th>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '16px 24px', width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text3)' }}>
                    No students match your search filters.
                  </td>
                </tr>
              ) : filtered.map((student, idx) => (
                <motion.tr 
                  key={student.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  style={{ borderBottom: '1px solid var(--border2)' }}
                  whileHover={{ backgroundColor: 'var(--surface3)' }}
                >
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar name={student.name} size={40} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{student.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {student.groups.map(g => (
                        <span key={g} style={{ 
                          padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                          background: 'rgba(14, 165, 233, 0.08)', color: 'var(--primary-700)', border: '1px solid rgba(14, 165, 233, 0.15)'
                        }}>{g}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>
                        Grade: <span style={{ color: student.avgGrade >= 85 ? 'var(--success)' : student.avgGrade < 70 ? 'var(--danger)' : 'var(--text2)' }}>{student.avgGrade}%</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>
                        Attend: <span style={{ color: student.attendance >= 90 ? 'var(--text2)' : 'var(--warning)' }}>{student.attendance}%</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>{student.guardian}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                      background: student.status === 'Active' ? 'var(--success-light)' : student.status === 'Monitor' ? 'var(--warning-light)' : 'var(--error-light)',
                      color: student.status === 'Active' ? 'var(--success)' : student.status === 'Monitor' ? 'var(--warning)' : 'var(--danger)'
                    }}>
                      {student.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    {/* Dummy route to existing nested Student Profile */}
                    <button 
                      onClick={() => navigate(`/groups/global/students/${student.id}`)}
                      style={{ 
                        width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text4)', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid transparent'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--text4)'; }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
