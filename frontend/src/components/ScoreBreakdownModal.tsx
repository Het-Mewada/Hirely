import { Dialog } from './ui/dialog';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';

export function ScoreBreakdownModal({
  isOpen,
  onClose,
  application,
}: {
  isOpen: boolean;
  onClose: () => void;
  application: any;
}) {
  if (!isOpen) return null;

  let b = application?.score_breakdown;
  if (typeof b === 'string') {
    try {
      b = JSON.parse(b);
    } catch {
      b = null;
    }
  }

  const candName = application?.candidate ? `${application.candidate.first_name} ${application.candidate.last_name}` : 'Candidate Profile';
  const jobTitle = application?.job_posting ? application.job_posting.title : 'Job Posting';

  const finalScore = b?.final_score ?? 0;
  const getMatchTier = (score: number) => {
    if (score >= 75) return { label: 'High Match', variant: 'success' as const, color: '#34d399' };
    if (score >= 45) return { label: 'Moderate Match', variant: 'warning' as const, color: '#fbbf24' };
    return { label: 'Low Match', variant: 'destructive' as const, color: '#f87171' };
  };

  const tier = getMatchTier(finalScore);

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Explainable ATS Match Score Breakdown">
      {!b ? (
        <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            No detailed score breakdown available for this application yet.
          </p>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
          {/* Header Overview Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem',
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>{candName}</h4>
                <Badge variant={tier.variant}>{tier.label}</Badge>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, fontWeight: 500 }}>{jobTitle}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2.25rem', fontWeight: 900, color: tier.color, lineHeight: 1 }}>
                {b.final_score}%
              </div>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem', marginBottom: 0 }}>
                Match Score
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h5 style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', margin: 0 }}>
              Component Weight Breakdown
            </h5>

            {/* Skill Overlap (60%) */}
            <div
              style={{
                padding: '1rem 1.25rem',
                borderRadius: '0.75rem',
                backgroundColor: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>

                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '0.625rem', height: '0.625rem', borderRadius: '9999px', backgroundColor: '#6366f1', display: 'inline-block' }}></span>
                  Skill Overlap (60% Weight)
                </span>
                <span style={{ color: '#818cf8', fontWeight: 800 }}>
                  {b.skills_score}% <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>({b.weighted_components?.skills_component ?? Math.round(b.skills_score * 0.6)} pts)</span>
                </span>
              </div>
              <Progress value={b.skills_score || 0} color="linear-gradient(90deg, #6366f1, #818cf8)" />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                {b.matched_skills && b.matched_skills.length > 0 && (
                  <div>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                      Matched Skills ({b.matched_skills.length})
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {b.matched_skills.map((s: string, i: number) => (
                        <Badge key={i} variant="success">✓ {s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {b.missing_skills && b.missing_skills.length > 0 && (
                  <div>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                      Missing Required Skills ({b.missing_skills.length})
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {b.missing_skills.map((s: string, i: number) => (
                        <Badge key={i} variant="destructive">✗ {s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {(!b.matched_skills || b.matched_skills.length === 0) && (!b.missing_skills || b.missing_skills.length === 0) && (
                  <p style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>No skill requirements recorded for this position.</p>
                )}
              </div>
            </div>

            {/* Experience Fit (30%) */}
            <div
              style={{
                padding: '1rem 1.25rem',
                borderRadius: '0.75rem',
                backgroundColor: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '0.625rem', height: '0.625rem', borderRadius: '9999px', backgroundColor: '#a855f7', display: 'inline-block' }}></span>
                  Experience Fit (30% Weight)
                </span>
                <span style={{ color: '#c084fc', fontWeight: 800 }}>
                  {b.experience_score}% <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>({b.weighted_components?.experience_component ?? Math.round(b.experience_score * 0.3)} pts)</span>
                </span>
              </div>
              <Progress value={b.experience_score || 0} color="linear-gradient(90deg, #a855f7, #c084fc)" />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.4)',
                  borderRadius: '0.5rem',
                  fontSize: '0.8rem',
                  color: '#cbd5e1'
                }}
              >
                <span>Candidate Experience: <strong style={{ color: '#f8fafc' }}>{b.candidate_experience_years ?? 0} yrs</strong></span>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                <span>Job Stated Minimum: <strong style={{ color: '#f8fafc' }}>{b.job_required_experience_years ?? 0} yrs</strong></span>
              </div>
            </div>

            {/* Keyword/TF-IDF Cosine Similarity (10%) */}
            <div
              style={{
                padding: '1rem 1.25rem',
                borderRadius: '0.75rem',
                backgroundColor: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '0.625rem', height: '0.625rem', borderRadius: '9999px', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                  TF-IDF Text Cosine Similarity (10% Weight)
                </span>
                <span style={{ color: '#34d399', fontWeight: 800 }}>
                  {b.similarity_score}% <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>({b.weighted_components?.similarity_component ?? Math.round(b.similarity_score * 0.1)} pts)</span>
                </span>
              </div>
              <Progress value={b.similarity_score || 0} color="linear-gradient(90deg, #10b981, #34d399)" />
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                Measures natural language cosine similarity between full resume text and job posting description.
              </p>
            </div>
          </div>

          <div style={{ paddingTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" onClick={onClose} style={{ minWidth: '100px' }}>
              Done
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

