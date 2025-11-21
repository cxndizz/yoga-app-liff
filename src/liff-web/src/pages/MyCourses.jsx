import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { mockMyCourses } from '../lib/mockData';
import { useAutoTranslate } from '../lib/autoTranslate';
import { formatAccessTimes } from '../lib/formatters';

function statusClass(paymentStatus) {
  if (paymentStatus === 'pending') return 'pill warning';
  if (paymentStatus === 'paid') return 'pill success';
  return 'pill';
}

function MyCourses() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { formatDate, formatPrice, language } = useAutoTranslate();

  const courses = mockMyCourses;

  const renderAccess = (course) => {
    if (course.accessRemaining === -1) return t('access.unlimited');
    if (course.accessRemaining === 0 && course.accessTotal === 0) return t('myCourses.streaming');
    return formatAccessTimes(course.accessRemaining, {
      language,
      singleLabel: t('access.single'),
      unlimitedLabel: t('access.unlimited'),
      multipleTemplate: t('access.multiple', { count: '{count}' }),
    });
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="section-heading">
        <div>
          <h2>{t('myCourses.title')}</h2>
          <div className="helper-text">{t('myCourses.subtitle')}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/courses')}>
            {t('common.viewAll')}
          </button>
        </div>
      </div>

      <div className="grid">
        {courses.map((course) => (
          <div key={course.id} className="card-surface mycourse-card">
            <div className="mycourse-cover" aria-hidden>
              <img src={course.coverImage} alt={course.title} />
            </div>
            <div className="mycourse-body">
              <div className="mycourse-header">
                <div>
                  <div className="badge">{course.channel}</div>
                  <h3>{course.title}</h3>
                  <div className="helper-text">{course.branchName}</div>
                  <div className="helper-text">{course.instructorName}</div>
                </div>
                <div className={statusClass(course.paymentStatus)}>
                  {course.paymentStatus === 'pending' ? t('myCourses.statusPending') : t('myCourses.statusPaid')}
                </div>
              </div>

              <div className="mycourse-meta">
                <div>
                  <div className="helper-text">{t('myCourses.nextSession')}</div>
                  <div style={{ fontWeight: 700 }}>
                    {formatDate(course.nextSession.date)} · {course.nextSession.time}
                  </div>
                  <div className="helper-text">{course.nextSession.topic}</div>
                </div>
                <div>
                  <div className="helper-text">{t('myCourses.remaining')}</div>
                  <div style={{ fontWeight: 700 }}>{renderAccess(course)}</div>
                  <div className="helper-text">{t('myCourses.reference', { ref: course.reference })}</div>
                </div>
              </div>

              <div className="mycourse-actions">
                <div>
                  <div className="helper-text">{t('myCourses.amount')}</div>
                  <div style={{ fontWeight: 800 }}>
                    {formatPrice(course.priceCents, course.isFree)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {course.paymentStatus === 'pending' && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => navigate(`/courses/${course.courseId || course.id}/checkout`)}
                    >
                      {t('myCourses.payNow')}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => navigate(`/courses/${course.courseId || course.id}`)}
                  >
                    {t('myCourses.goToCourse')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card-surface" style={{ padding: 16 }}>
        <div className="helper-text">{t('myCourses.mockData')}</div>
      </div>
    </div>
  );
}

export default MyCourses;
