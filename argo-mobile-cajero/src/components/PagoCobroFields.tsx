import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { ScaledText } from './ScaledText';
import { MoneyText } from './MoneyText';
import { SurfaceCard } from './SurfaceCard';
import { CatalogoSelectField } from './CatalogoSelectField';
import { fetchCuentasBancarias, fetchTiposPago } from '../api/catalogosApi';
import { previewPagoExtras, type PreviewServicioAdicionalItem } from '../api/configApi';
import type { CatalogoItem } from '../api/domain';
import {
  esEfectivoTipoPago,
  etiquetaCuenta,
  etiquetaTipoPago,
  idCuentaItem,
  idTipoPagoItem,
  validarPagoIntangible,
  type SoportePago,
} from '../utils/pago';
import { useAccessibility } from '../context/AccessibilityContext';
import { themeColors } from '../theme/colors';
import { CAJERO_AZUL_REY } from '../config/appBranding';

export type { SoportePago } from '../utils/pago';

export type PagoCobroState = {
  idTipoPago: string;
  idCuentaBancaria: string;
  numComprobante: string;
  observaciones: string;
  soporte: SoportePago | null;
  extras: PreviewServicioAdicionalItem[];
  totalExtras: number;
};

type Props = {
  idLiquidaciones: string[];
  subtotalItems: number;
  value: PagoCobroState;
  onChange: (patch: Partial<PagoCobroState>) => void;
  /** Sincroniza catálogo cargado con el padre (validación al cobrar). */
  onTiposLoaded?: (tipos: CatalogoItem[]) => void;
};

const empty: PagoCobroState = {
  idTipoPago: '',
  idCuentaBancaria: '',
  numComprobante: '',
  observaciones: '',
  soporte: null,
  extras: [],
  totalExtras: 0,
};

export function pagoCobroStateInicial(): PagoCobroState {
  return { ...empty };
}

export function validarEstadoPago(
  state: PagoCobroState,
  tipos: CatalogoItem[],
): { ok: boolean; message?: string } {
  return validarPagoIntangible({
    idTipoPago: state.idTipoPago,
    tipos,
    idCuentaBancaria: state.idCuentaBancaria,
    numComprobante: state.numComprobante,
    soporteUri: state.soporte?.uri ?? null,
  });
}

export function PagoCobroFields({
  idLiquidaciones,
  subtotalItems,
  value,
  onChange,
  onTiposLoaded,
}: Props) {
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const [tipos, setTipos] = useState<CatalogoItem[]>([]);
  const [cuentas, setCuentas] = useState<CatalogoItem[]>([]);

  useEffect(() => {
    let cancel = false;
    void Promise.all([fetchTiposPago(), fetchCuentasBancarias()]).then(([t, cu]) => {
      if (cancel) return;
      setTipos(t);
      setCuentas(cu);
      onTiposLoaded?.(t);
      // Si aún no hay forma de pago, no forzar efectivo: el usuario debe elegir.
    });
    return () => {
      cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const esEfectivo = useMemo(
    () => (value.idTipoPago ? esEfectivoTipoPago(value.idTipoPago, tipos) : true),
    [value.idTipoPago, tipos],
  );
  const requiereDatosBanco = !!value.idTipoPago && !esEfectivo;

  const opcionesTipos = useMemo(
    () => tipos.map((t) => ({ value: idTipoPagoItem(t), label: etiquetaTipoPago(t) })),
    [tipos],
  );
  const opcionesCuentas = useMemo(
    () => cuentas.map((cu) => ({ value: idCuentaItem(cu), label: etiquetaCuenta(cu) })),
    [cuentas],
  );

  useEffect(() => {
    const ids = idLiquidaciones.filter(Boolean);
    if (!value.idTipoPago || !ids.length) {
      onChange({ extras: [], totalExtras: 0 });
      return;
    }
    let cancel = false;
    void previewPagoExtras(value.idTipoPago, ids)
      .then((r) => {
        if (cancel) return;
        onChange({
          extras: r.items ?? [],
          totalExtras: Number(r.totalExtras) || 0,
        });
      })
      .catch(() => {
        if (!cancel) onChange({ extras: [], totalExtras: 0 });
      });
    return () => {
      cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.idTipoPago, idLiquidaciones.join('|')]);

  function seleccionarTipo(id: string) {
    onChange({
      idTipoPago: id,
      idCuentaBancaria: '',
      numComprobante: '',
      soporte: null,
    });
  }

  async function pickFromLibrary() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso', 'Permita acceso a fotos para adjuntar el soporte.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (res.canceled || !res.assets[0]) return;
    aplicarAsset(res.assets[0]);
  }

  async function pickFromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso', 'Permita acceso a la cámara para fotografiar el soporte.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      quality: 0.85,
    });
    if (res.canceled || !res.assets[0]) return;
    aplicarAsset(res.assets[0]);
  }

  function aplicarAsset(asset: ImagePicker.ImagePickerAsset) {
    onChange({
      soporte: {
        uri: asset.uri,
        name: asset.fileName || `soporte-${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      },
    });
  }

  function pedirSoporte() {
    Alert.alert('Soporte de pago', 'Adjunte el pantallazo o foto del movimiento.', [
      { text: 'Galería', onPress: () => void pickFromLibrary() },
      { text: 'Cámara', onPress: () => void pickFromCamera() },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  const total = subtotalItems + (value.totalExtras || 0);

  return (
    <View style={styles.wrap}>
      <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '800', marginBottom: 4 }}>
        Forma de pago
      </ScaledText>
      <ScaledText baseSize={12} style={{ color: c.textSoft, marginBottom: 8, lineHeight: 17 }}>
        Elija el medio. Si no es efectivo, deberá indicar cuenta, referencia y adjuntar el soporte.
      </ScaledText>

      <View style={styles.chipsWrap}>
        {tipos.map((t) => {
          const id = idTipoPagoItem(t);
          const on = value.idTipoPago === id;
          return (
            <Pressable
              key={id}
              onPress={() => seleccionarTipo(id)}
              style={[
                styles.chip,
                {
                  borderColor: on ? c.primary : c.border,
                  backgroundColor: on ? c.primary : c.card,
                },
              ]}
            >
              <ScaledText baseSize={12} style={{ color: on ? '#fff' : c.text, fontWeight: '700' }}>
                {etiquetaTipoPago(t)}
              </ScaledText>
            </Pressable>
          );
        })}
      </View>

      <CatalogoSelectField
        label="O busque otra forma de pago"
        value={value.idTipoPago}
        options={opcionesTipos}
        onChange={seleccionarTipo}
        placeholder="Seleccione forma de pago…"
        required
      />

      {requiereDatosBanco ? (
        <View style={[styles.bancoBox, { borderColor: 'rgba(53,120,240,0.25)', backgroundColor: highContrast ? c.bgAlt : '#eff6ff' }]}>
          <ScaledText baseSize={14} style={{ color: c.text, fontWeight: '800', marginBottom: 4 }}>
            Datos del pago electrónico
          </ScaledText>
          <ScaledText baseSize={12} style={{ color: c.textSoft, marginBottom: 10, lineHeight: 17 }}>
            Cuenta destino, número de comprobante y pantallazo del movimiento (obligatorios).
          </ScaledText>

          <CatalogoSelectField
            label="Cuenta de la empresa"
            value={value.idCuentaBancaria}
            options={opcionesCuentas}
            onChange={(v) => onChange({ idCuentaBancaria: v })}
            placeholder="Cuenta donde ingresó el dinero…"
            required
          />

          <ScaledText baseSize={13} style={{ color: c.textSoft, marginTop: 4, marginBottom: 4, fontWeight: '600' }}>
            Nº comprobante / referencia *
          </ScaledText>
          <TextInput
            value={value.numComprobante}
            onChangeText={(t) => onChange({ numComprobante: t })}
            placeholder="Obligatorio para este medio de pago"
            placeholderTextColor="#94a3b8"
            style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.card }]}
          />

          <View style={styles.soporteHead}>
            <ScaledText baseSize={13} style={{ color: c.text, fontWeight: '700' }}>
              Soporte de pago (imagen) *
            </ScaledText>
            <ScaledText baseSize={11} style={{ color: c.textSoft, marginTop: 2, lineHeight: 15 }}>
              Pantallazo de transferencia, Nequi, voucher de tarjeta, cheque, etc.
            </ScaledText>
          </View>

          <View style={styles.soporteActions}>
            <Pressable
              onPress={pedirSoporte}
              style={[styles.soporteBtn, { borderColor: c.primary, backgroundColor: c.card }]}
            >
              <Ionicons name="image-outline" size={18} color={c.primary} />
              <ScaledText baseSize={13} style={{ color: c.primary, fontWeight: '700' }}>
                {value.soporte ? 'Cambiar imagen' : 'Seleccionar pantallazo'}
              </ScaledText>
            </Pressable>
            {value.soporte ? (
              <Pressable
                onPress={() => onChange({ soporte: null })}
                style={[styles.soporteBtnGhost, { borderColor: c.danger }]}
              >
                <Ionicons name="trash-outline" size={16} color={c.danger} />
                <ScaledText baseSize={12} style={{ color: c.danger, fontWeight: '700' }}>
                  Quitar
                </ScaledText>
              </Pressable>
            ) : null}
          </View>

          {value.soporte ? (
            <>
              <ScaledText baseSize={11} style={{ color: c.ok, fontWeight: '600', marginTop: 6 }}>
                {value.soporte.name}
              </ScaledText>
              <Image source={{ uri: value.soporte.uri }} style={styles.preview} resizeMode="cover" />
            </>
          ) : (
            <ScaledText baseSize={12} style={{ color: c.warn, fontWeight: '600', marginTop: 8 }}>
              Sin archivo — obligatorio para registrar
            </ScaledText>
          )}
        </View>
      ) : null}

      <ScaledText baseSize={13} style={{ color: c.textSoft, marginTop: 8, marginBottom: 4, fontWeight: '600' }}>
        Observaciones
      </ScaledText>
      <TextInput
        value={value.observaciones}
        onChangeText={(t) => onChange({ observaciones: t })}
        placeholder="Opcional"
        placeholderTextColor="#94a3b8"
        style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.bg }]}
      />

      {value.extras.length ? (
        <SurfaceCard elevated={false} style={{ padding: 10, marginTop: 8, gap: 4 }}>
          <ScaledText baseSize={13} style={{ color: c.textSoft, fontWeight: '600' }}>
            Servicios adicionales al cobrar
          </ScaledText>
          {value.extras.map((ex) => (
            <View key={`${ex.idServ}-${ex.descripcion}`} style={styles.extraRow}>
              <ScaledText baseSize={12} style={{ color: c.text, flex: 1 }}>{ex.descripcion}</ScaledText>
              <MoneyText value={ex.valor} baseSize={12} style={{ color: c.text }} />
            </View>
          ))}
        </SurfaceCard>
      ) : null}

      <View style={styles.totalRow}>
        <ScaledText baseSize={14} style={{ color: c.textSoft }}>Total a cobrar</ScaledText>
        <MoneyText value={total} baseSize={18} style={{ color: CAJERO_AZUL_REY }} bold />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8, gap: 4 },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  bancoBox: {
    marginTop: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  soporteHead: { marginTop: 10 },
  soporteActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  soporteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  soporteBtnGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  preview: { marginTop: 10, width: '100%', height: 160, borderRadius: 10 },
  extraRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#cbd5e1',
  },
});
