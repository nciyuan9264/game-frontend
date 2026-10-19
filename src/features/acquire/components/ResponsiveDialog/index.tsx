import {
  ResponsiveDialog as GameResponsiveDialog,
  type ResponsiveDialogProps,
} from '@/components/GameUI/ResponsiveDialog';
import rootStyles from '../../styles/root.module.less';

type Props = Omit<ResponsiveDialogProps, 'themeClassName'>;

export function ResponsiveDialog(props: Props) {
  return <GameResponsiveDialog {...props} themeClassName={rootStyles.root} />;
}
