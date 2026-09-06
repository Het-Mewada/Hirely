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

  const candName = application?.candidate ? `${application.candidate.first_name} ${application.candidate.last_name}` : 'Candidate profile';
  const jobTitle = application?.job_posting ? application.job_posting.title : 'Job posting';

  const finalScore = b?.final_score ?? 0;
  const getMatchTier = (score: number) => {
    if (score >= 75) return { label: 'High match', variant: 'matched' as const, color: 'var(--status-matched)' };
    if (score >= 45) return { label: 'Moderate match', variant: 'pending' as const, color: 'var(--status-pending)' };
    return { label: 'Low match', variant: 'rejected' as const, color: 'var(--status-rejected)' };
  };

  const tier = getMatchTier(finalScore);

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="ATS match score breakdown">
      {!b ? (
        <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            No detailed score breakdown available for this application yet.
          </p>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
          {/* Header Overview Panel */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem',
              backgroundColor: 'var(--bg-canvas)',
              borderRadius: '4px',
              border: '1px solid var(--border-color)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <h4 style={{ fontFamily: "var(--font-serif, 'Source Serif 4', Georgia, serif)", fontSize: '1.25rem', fontWeight: 600, color: 'var(--ink-primary)', margin: 0 }}>
                  {candName}
                </h4>
                <Badge variant={tier.variant}>{tier.label}</Badge>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', margin: 0 }}>{jobTitle}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: tier.color, lineHeight: 1 }}>
                {b.final_score}%
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '0.25rem', marginBottom: 0 }}>
                Match score
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)' }}>
              Component weight breakdown
            </div>

            {/* Skill Overlap (60%) */}
            <div
              style={{
                padding: '1rem',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-canvas)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.625rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
                <span>Skill overlap (60% weight)</span>
                <span style={{ color: 'var(--accent-navy)' }}>
                  {b.skills_score}% <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontWeight: 400 }}>({b.weighted_components?.skills_component ?? Math.round(b.skills_score * 0.6)} pts)</span>
                </span>
              </div>
              <Progress value={b.skills_score || 0} color="var(--accent-navy)" />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.25rem' }}>
                {b.matched_skills && b.matched_skills.length > 0 && (
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--status-matched)', marginBottom: '0.25rem' }}>
                      Matched skills ({b.matched_skills.length})
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {b.matched_skills.map((s: string, i: number) => (
                        <Badge key={i} variant="matched">✓ {s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {b.missing_skills && b.missing_skills.length > 0 && (
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--status-rejected)', marginBottom: '0.25rem' }}>
                      Missing required skills ({b.missing_skills.length})
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {b.missing_skills.map((s: string, i: number) => (
                        <Badge key={i} variant="rejected">✗ {s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Experience Fit (30%) */}
            <div
              style={{
                padding: '1rem',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-canvas)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.625rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
                <span>Experience fit (30% weight)</span>
                <span style={{ color: 'var(--accent-navy)' }}>
                  {b.experience_score}% <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontWeight: 400 }}>({b.weighted_components?.experience_component ?? Math.round(b.experience_score * 0.3)} pts)</span>
                </span>
              </div>
              <Progress value={b.experience_score || 0} color="var(--accent-navy)" />
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                Candidate experience: <strong>{b.candidate_experience_years ?? 0} yrs</strong> • Job stated minimum: <strong>{b.job_required_experience_years ?? 0} yrs</strong>
              </div>
            </div>

            {/* Keyword/TF-IDF Cosine Similarity (10%) */}
            <div
              style={{
                padding: '1rem',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-canvas)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.625rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
                <span>TF-IDF text similarity (10% weight)</span>
                <span style={{ color: 'var(--accent-navy)' }}>
                  {b.similarity_score}% <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontWeight: 400 }}>({b.weighted_components?.similarity_component ?? Math.round(b.similarity_score * 0.1)} pts)</span>
                </span>
              </div>
              <Progress value={b.similarity_score || 0} color="var(--accent-navy)" />
            </div>
          </div>

          <div style={{ paddingTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
