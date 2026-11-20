import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { Banner } from './Banner';
import { Button } from './Button';
import { Icon } from './Icon';
import { colors, motion, radius, shadows, spacing } from './theme';

type ToastTone = 'success' | 'danger' | 'info';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface FeedbackContextValue {
  toast: (message: string, tone?: ToastTone) => void;
  /** Diálogo de confirmação que funciona igual no app e na web (Alert.alert não funciona na web). */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toastState, setToastState] = useState<{
    id: number;
    message: string;
    tone: ToastTone;
  } | null>(null);
  const [dialog, setDialog] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);
  const toastId = useRef(0);

  const toast = useCallback((message: string, tone: ToastTone = 'info') => {
    toastId.current += 1;
    setToastState({ id: toastId.current, message, tone });
  }, []);

  useEffect(() => {
    if (!toastState) return;
    const id = setTimeout(() => setToastState(null), 3500);
    return () => clearTimeout(id);
  }, [toastState]);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setDialog(options);
      }),
    [],
  );

  const close = (result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setDialog(null);
  };

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      {toastState ? (
        <View pointerEvents="box-none" style={[styles.toastWrap, { top: insets.top + spacing.sm }]}>
          <Animated.View
            key={toastState.id}
            entering={FadeInUp.duration(motion.base)}
            exiting={FadeOutUp.duration(motion.fast)}
            style={styles.toast}
          >
            <Pressable onPress={() => setToastState(null)} accessibilityRole="alert">
              <Banner
                tone={
                  toastState.tone === 'danger'
                    ? 'danger'
                    : toastState.tone === 'success'
                      ? 'success'
                      : 'info'
                }
                message={toastState.message}
              />
            </Pressable>
          </Animated.View>
        </View>
      ) : null}

      <Modal
        transparent
        visible={!!dialog}
        animationType="fade"
        onRequestClose={() => close(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.dialog} accessibilityViewIsModal>
            <View
              style={[
                styles.dialogIcon,
                { backgroundColor: dialog?.destructive ? colors.dangerSoft : colors.primarySoft },
              ]}
            >
              <Icon
                name={dialog?.destructive ? 'warning-outline' : 'help-circle-outline'}
                size={24}
                color={dialog?.destructive ? 'danger' : 'primary'}
              />
            </View>
            <AppText variant="title">{dialog?.title}</AppText>
            {dialog?.message ? <AppText color="textMuted">{dialog.message}</AppText> : null}
            <View style={styles.actions}>
              <Button
                label={dialog?.cancelLabel ?? 'Cancelar'}
                variant="outline"
                onPress={() => close(false)}
              />
              <Button
                label={dialog?.confirmLabel ?? 'Confirmar'}
                variant={dialog?.destructive ? 'danger' : 'primary'}
                onPress={() => close(true)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </FeedbackContext.Provider>
  );
}

function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('FeedbackProvider ausente');
  return ctx;
}

export const useToast = () => useFeedback().toast;
export const useConfirm = () => useFeedback().confirm;

const styles = StyleSheet.create({
  toastWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  toast: { width: '100%', maxWidth: 520, borderRadius: radius.md, boxShadow: shadows.raised },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    padding: spacing.xl,
    gap: spacing.md,
    boxShadow: shadows.overlay,
  },
  dialogIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
