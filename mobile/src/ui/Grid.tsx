import { useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { spacing } from './theme';

interface Props {
  children: ReactNode[] | ReactNode;
  /** largura mínima de cada item; o número de colunas se adapta ao espaço disponível */
  minItemWidth?: number;
  gap?: number;
}

/** Grade responsiva: 1 coluna no celular, 2 ou 3 em telas largas. */
export function Grid({ children, minItemWidth = 300, gap = spacing.lg }: Props) {
  const [width, setWidth] = useState(0);
  const items = Array.isArray(children) ? children : [children];
  const columns = Math.max(1, Math.floor((width + gap) / (minItemWidth + gap)));
  const itemWidth = width > 0 ? (width - gap * (columns - 1)) / columns : undefined;

  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.floor(e.nativeEvent.layout.width));

  return (
    <View style={[styles.grid, { gap }]} onLayout={onLayout}>
      {width > 0
        ? items.map((child, i) => (
            <View key={i} style={{ width: itemWidth }}>
              {child}
            </View>
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({ grid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' } });
