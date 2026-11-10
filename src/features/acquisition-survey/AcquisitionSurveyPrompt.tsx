import { Send } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { ResponsiveDialog } from '@/components/GameUI/ResponsiveDialog';
import { useAcquisitionSurvey } from './useAcquisitionSurvey';
import styles from './index.module.less';

const maxOtherDetailLength = 255;
const ignoreClose = () => undefined;

export function AcquisitionSurveyPrompt() {
  const location = useLocation();
  const survey = useAcquisitionSurvey(!location.pathname.startsWith('/admin'));

  if (!survey.visible) return null;

  return (
    <ResponsiveDialog
      title="你是从哪里知道 GameBus 的？"
      eyebrow="玩家来源调查"
      onClose={ignoreClose}
      dismissible={false}
      className={styles.dialog}
      footer={(
        <ActionButton
          variant="primary"
          pending={survey.submitting}
          disabled={!survey.canSubmit}
          onClick={() => void survey.submit()}
        >
          <Send size={15} />
          提交
        </ActionButton>
      )}
    >
      <div className={styles.options} role="radiogroup" aria-label="玩家来源">
        {survey.options.map(option => {
          const selected = option.value === survey.selectedSource;
          return (
            <label key={option.value} className={selected ? styles.selected : undefined}>
              <input
                type="radio"
                name="acquisition-source"
                value={option.value}
                checked={selected}
                disabled={survey.submitting}
                onChange={() => survey.selectSource(option.value)}
              />
              <span>{option.label}</span>
              <i aria-hidden="true" />
            </label>
          );
        })}
      </div>
      {survey.selectedSource === 'other' && (
        <label className={styles.detail}>
          <span>请补充说明</span>
          <textarea
            value={survey.otherDetail}
            aria-label="请补充说明"
            required
            maxLength={maxOtherDetailLength}
            rows={3}
            disabled={survey.submitting}
            placeholder="请填写具体来源"
            onChange={event => survey.updateOtherDetail(event.target.value)}
          />
          <small>{survey.otherDetail.length}/{maxOtherDetailLength}</small>
        </label>
      )}
      <div className={styles.error} aria-live="polite">{survey.error}</div>
    </ResponsiveDialog>
  );
}
