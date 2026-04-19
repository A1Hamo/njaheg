import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../i18n/index';
import { SCHOOL_CURRICULUM, UNIVERSITY_CURRICULUM } from '../../data/egyptianCurriculum';

const TABS = [
  { id: 'schools',      iconEm: '🏫' },
  { id: 'universities', iconEm: '🎓' },
  { id: 'private',      iconEm: '👨‍🏫' },
];

export default function CurriculumBrowser() {
  const { t, lang } = useTranslation();
  const [activeTab,    setActiveTab]    = useState('schools');
  const [activeStage,  setActiveStage]  = useState('primary');
  const [activeGrade,  setActiveGrade]  = useState(null);
  const [activeSubject, setActiveSubject] = useState(null);
  const [activeUnit,   setActiveUnit]   = useState(null);
  const [activeFaculty, setActiveFaculty] = useState(null);
  const [activeDept,   setActiveDept]   = useState(null);

  const stages = {
    primary:     SCHOOL_CURRICULUM.primary,
    preparatory: SCHOOL_CURRICULUM.preparatory,
    secondary:   SCHOOL_CURRICULUM.secondary,
  };

  const getSubjects = (grade) => {
    if (!grade) return [];
    const s = grade.subjects;
    if (Array.isArray(s)) return s;
    return [...(s.core||[]), ...(s.science||[]), ...(s.arts||[])];
  };

  const currentFaculty = UNIVERSITY_CURRICULUM.faculties.find(f => f.id === activeFaculty);
  const currentDept    = currentFaculty?.departments.find(d => d.id === activeDept);

  return (
    <div className="page-container" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)' }}>
          📚 {t('curriculum.title')}
        </h1>
        <p style={{ color: 'var(--text3)', marginTop: 6, fontSize: 14 }}>
          {lang === 'ar'
            ? 'تصفح المناهج الرسمية المصرية للمدارس والجامعات'
            : 'Browse official Egyptian curricula for schools and universities'}
        </p>
      </div>

      {/* ── Main Tabs ── */}
      <div className="group-tab-bar" style={{ marginBottom: 28 }}>
        {TABS.map(tab => (
          <button key={tab.id}
            className={`group-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.iconEm} {t(`curriculum.${tab.id}`)}
          </button>
        ))}
      </div>

      {/* ══ SCHOOLS TAB ══════════════════════════════════════ */}
      {activeTab === 'schools' && (
        <div style={{ display: 'flex', gap: 20, minHeight: 500 }}>

          {/* Stage selector */}
          <div style={{ width: 180, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(stages).map(([key, stage]) => (
              <button key={key}
                onClick={() => { setActiveStage(key); setActiveGrade(null); setActiveSubject(null); setActiveUnit(null); }}
                style={{
                  padding: '12px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: activeStage === key ? 'var(--primary)' : 'var(--surface)',
                  color: activeStage === key ? '#fff' : 'var(--text3)',
                  fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-body)',
                  border: `1px solid ${activeStage === key ? 'var(--primary)' : 'var(--border)'}`,
                  transition: 'all 0.2s', textAlign: lang === 'ar' ? 'right' : 'left',
                }}
              >
                {stage.nameAr}
              </button>
            ))}
          </div>

          {/* Grades list */}
          <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stages[activeStage]?.grades.map(grade => (
              <button key={grade.grade}
                onClick={() => { setActiveGrade(grade); setActiveSubject(null); setActiveUnit(null); }}
                style={{
                  padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                  background: activeGrade?.grade === grade.grade ? 'rgba(99,102,241,0.1)' : 'var(--surface)',
                  border: `1px solid ${activeGrade?.grade === grade.grade ? 'var(--primary)' : 'var(--border)'}`,
                  color: activeGrade?.grade === grade.grade ? 'var(--blue-700)' : 'var(--text2)',
                  fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-body)',
                  transition: 'all 0.18s', textAlign: lang === 'ar' ? 'right' : 'left',
                }}
              >
                {grade.nameAr}
              </button>
            ))}
          </div>

          {/* Subjects list */}
          {activeGrade && (
            <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {getSubjects(activeGrade).map(sub => (
                <button key={sub.id}
                  onClick={() => { setActiveSubject(sub); setActiveUnit(null); }}
                  style={{
                    padding: '11px 14px', borderRadius: 12, cursor: 'pointer',
                    background: activeSubject?.id === sub.id ? 'rgba(245,158,11,0.1)' : 'var(--surface)',
                    border: `1px solid ${activeSubject?.id === sub.id ? 'var(--amber-400)' : 'var(--border)'}`,
                    color: activeSubject?.id === sub.id ? 'var(--amber-700)' : 'var(--text2)',
                    fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-body)',
                    transition: 'all 0.18s', textAlign: lang === 'ar' ? 'right' : 'left',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  {sub.isCore ? '⭐' : '📗'} {sub.nameAr}
                  <span style={{ fontSize: 10, color: 'var(--text4)', marginInlineStart: 'auto' }}>
                    {sub.weeklyHours}h
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Units & Lessons */}
          {activeSubject && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                background: 'var(--surface)', borderRadius: 16, padding: 24,
                border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
              }}>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)', marginBottom: 4 }}>
                  {activeSubject.nameAr}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text4)', marginBottom: 20 }}>
                  {activeGrade.nameAr} · {activeSubject.weeklyHours} {lang === 'ar' ? 'حصص/أسبوع' : 'hrs/week'}
                </p>
                {activeSubject.units?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {activeSubject.units.map(unit => (
                      <motion.div key={unit.unit}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        style={{
                          border: '1px solid var(--border)', borderRadius: 12,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          onClick={() => setActiveUnit(activeUnit?.unit === unit.unit ? null : unit)}
                          style={{
                            padding: '14px 18px', cursor: 'pointer',
                            background: activeUnit?.unit === unit.unit ? 'rgba(99,102,241,0.06)' : 'var(--surface2)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            transition: 'background 0.18s',
                          }}
                        >
                          <div>
                            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text4)', textTransform: 'uppercase' }}>
                              {lang === 'ar' ? `الوحدة ${unit.unit}` : `Unit ${unit.unit}`}
                            </span>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>
                              {unit.nameAr}
                            </div>
                          </div>
                          <span style={{ fontSize: 18, color: 'var(--text4)', transition: 'transform 0.2s',
                            transform: activeUnit?.unit === unit.unit ? 'rotate(180deg)' : 'none' }}>⌄</span>
                        </div>
                        <AnimatePresence>
                          {activeUnit?.unit === unit.unit && unit.lessons?.length > 0 && (
                            <motion.div
                              initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div style={{ padding: '12px 18px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {unit.lessons.map((lesson, i) => (
                                  <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '10px 14px', borderRadius: 10,
                                    background: 'var(--surface3)', border: '1px solid var(--border)',
                                  }}>
                                    <div style={{
                                      width: 26, height: 26, borderRadius: '50%',
                                      background: 'var(--primary)', color: '#fff',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: 11, fontWeight: 800, flexShrink: 0,
                                    }}>
                                      {i + 1}
                                    </div>
                                    <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>
                                      {lesson}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    padding: 32, textAlign: 'center', color: 'var(--text4)',
                    fontSize: 14, border: '1.5px dashed var(--border2)', borderRadius: 14,
                  }}>
                    📝 {lang === 'ar' ? 'لم تُضف وحدات بعد' : 'No units added yet'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ UNIVERSITIES TAB ═════════════════════════════════ */}
      {activeTab === 'universities' && (
        <div style={{ display: 'flex', gap: 20, minHeight: 500 }}>

          {/* Faculties */}
          <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {UNIVERSITY_CURRICULUM.faculties.map(fac => (
              <button key={fac.id}
                onClick={() => { setActiveFaculty(fac.id); setActiveDept(null); }}
                style={{
                  padding: '12px 16px', borderRadius: 12, cursor: 'pointer', textAlign: lang === 'ar' ? 'right' : 'left',
                  background: activeFaculty === fac.id ? 'var(--primary)' : 'var(--surface)',
                  border: `1px solid ${activeFaculty === fac.id ? 'var(--primary)' : 'var(--border)'}`,
                  color: activeFaculty === fac.id ? '#fff' : 'var(--text2)',
                  fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-body)',
                  transition: 'all 0.18s',
                }}
              >
                {fac.nameAr}
                <span style={{ display: 'block', fontSize: 11, opacity: 0.7, marginTop: 2 }}>
                  {fac.years} {lang === 'ar' ? 'سنوات' : 'years'}
                </span>
              </button>
            ))}
          </div>

          {/* Departments */}
          {currentFaculty && (
            <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {currentFaculty.departments.map(dept => (
                <button key={dept.id}
                  onClick={() => setActiveDept(dept.id)}
                  style={{
                    padding: '11px 14px', borderRadius: 12, cursor: 'pointer', textAlign: lang === 'ar' ? 'right' : 'left',
                    background: activeDept === dept.id ? 'rgba(99,102,241,0.1)' : 'var(--surface)',
                    border: `1px solid ${activeDept === dept.id ? '#6366f1' : 'var(--border)'}`,
                    color: activeDept === dept.id ? '#4338ca' : 'var(--text2)',
                    fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-body)',
                    transition: 'all 0.18s',
                  }}
                >
                  {dept.nameAr}
                </button>
              ))}
            </div>
          )}

          {/* Courses */}
          {currentDept && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                background: 'var(--surface)', borderRadius: 16, padding: 24,
                border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
              }}>
                <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 20 }}>{currentDept.nameAr}</h3>
                {[1,2,3,4,5,6].map(yr => {
                  const courses = currentDept.courses.filter(c => c.year === yr);
                  if (!courses.length) return null;
                  return (
                    <div key={yr} style={{ marginBottom: 20 }}>
                      <div style={{
                        fontSize: 11, fontWeight: 800, color: 'var(--text4)', textTransform: 'uppercase',
                        letterSpacing: '0.08em', marginBottom: 10,
                      }}>
                        {lang === 'ar' ? `السنة ${yr}` : `Year ${yr}`}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {courses.map(c => (
                          <div key={c.code} style={{
                            padding: '12px 16px', borderRadius: 12,
                            background: 'var(--surface2)', border: '1px solid var(--border)',
                            display: 'flex', alignItems: 'center', gap: 14,
                          }}>
                            <span style={{
                              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                              color: 'var(--blue-600)', background: 'var(--blue-50)',
                              padding: '3px 8px', borderRadius: 6, flexShrink: 0,
                            }}>{c.code}</span>
                            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                              {c.nameAr}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--text4)', flexShrink: 0 }}>
                              {c.credits} {lang === 'ar' ? 'ساعة' : 'cr'}
                            </span>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
                              background: c.semester === 'Fall' ? 'rgba(99,102,241,0.1)' : 'rgba(245,158,11,0.1)',
                              color: c.semester === 'Fall' ? 'var(--blue-700)' : 'var(--amber-700)',
                              border: `1px solid ${c.semester === 'Fall' ? 'rgba(99,102,241,0.2)' : 'rgba(245,158,11,0.2)'}`,
                            }}>
                              {c.semester}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ PRIVATE TAB ═════════════════════════════════════ */}
      {activeTab === 'private' && (
        <div style={{
          padding: 48, textAlign: 'center',
          background: 'var(--surface)', borderRadius: 20,
          border: '1.5px dashed var(--border2)',
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>👨‍🏫</div>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
            {lang === 'ar' ? 'البرامج الخاصة' : 'Private Programs'}
          </h3>
          <p style={{ color: 'var(--text3)', fontSize: 14, maxWidth: 380, margin: '0 auto' }}>
            {lang === 'ar'
              ? 'قم بإنشاء مجموعة خاصة وسيتم عرض منهجها هنا تلقائيًا'
              : 'Create a private group and its curriculum will appear here automatically.'}
          </p>
        </div>
      )}
    </div>
  );
}
