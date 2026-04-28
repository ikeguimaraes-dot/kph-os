// Modal compartilhado pra justificar uma falta existente OU enviar um
// atestado médico novo. Faz upload pro bucket `documents` em base64 e
// grava o storage_path em absences.atestado_path.
//
// Modos:
//   - { mode: 'justify', absenceId, initialDate, employeeId } → UPDATE absence
//   - { mode: 'new', employeeId } → INSERT absence (tipo='atestado')

import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';
import { COLORS } from '../lib/types';

type JustifyMode = {
  mode: 'justify';
  absenceId: string;
  initialDate: string;       // YYYY-MM-DD
  employeeId: string;
};

type NewMode = {
  mode: 'new';
  employeeId: string;
};

type Props = (JustifyMode | NewMode) & {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AtestadoModal(props: Props) {
  const { visible, onClose, onSuccess } = props;

  const [data, setData] = useState<string>(
    props.mode === 'justify' ? props.initialDate : todayIso(),
  );
  const [motivo, setMotivo] = useState('');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setMotivo('');
    setFile(null);
    setData(props.mode === 'justify' ? props.initialDate : todayIso());
  }

  function handleClose() {
    if (submitting) return;
    reset();
    onClose();
  }

  async function pickPdf() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0]!;
    setFile({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? 'application/pdf',
    });
  }

  async function pickPhoto(useCamera: boolean) {
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Permita o acesso à câmera.');
        return;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Permita o acesso à galeria.');
        return;
      }
    }
    const res = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (res.canceled || !res.assets?.length) return;
    const asset = res.assets[0]!;
    const ext = asset.uri.split('.').pop() ?? 'jpg';
    setFile({
      uri: asset.uri,
      name: `atestado_${Date.now()}.${ext}`,
      mimeType: asset.mimeType ?? `image/${ext}`,
    });
  }

  async function handleSubmit() {
    if (!file) {
      Alert.alert('Anexo obrigatório', 'Selecione um arquivo do atestado.');
      return;
    }
    if (!data) {
      Alert.alert('Data obrigatória', 'Informe a data da falta.');
      return;
    }
    setSubmitting(true);
    try {
      const ext = file.name.split('.').pop() ?? 'pdf';
      const storagePath = `${props.employeeId}/atestado_${Date.now()}.${ext}`;

      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: 'base64',
      });
      const byteArray = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

      const { error: storageError } = await supabase.storage
        .from('documents')
        .upload(storagePath, byteArray, { contentType: file.mimeType });
      if (storageError) throw new Error(storageError.message);

      if (props.mode === 'justify') {
        const { error } = await supabase
          .from('absences')
          .update({
            tipo: 'atestado',
            motivo: motivo.trim() || null,
            atestado_path: storagePath,
          })
          .eq('id', props.absenceId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from('absences').insert({
          employee_id: props.employeeId,
          data,
          tipo: 'atestado',
          motivo: motivo.trim() || null,
          atestado_path: storagePath,
        });
        if (error) throw new Error(error.message);
      }

      reset();
      onSuccess();
      onClose();
      Alert.alert('Pronto', 'Atestado enviado com sucesso.');
    } catch (e: any) {
      console.error('[AtestadoModal] erro:', e);
      Alert.alert('Erro', e?.message ?? 'Falha ao enviar atestado.');
    } finally {
      setSubmitting(false);
    }
  }

  const title =
    props.mode === 'justify' ? 'Justificar falta' : 'Enviar atestado médico';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleClose} disabled={submitting}>
              <Ionicons name="close" size={24} color={COLORS.TEXT_SECONDARY} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Data da falta</Text>
          <TextInput
            value={data}
            onChangeText={setData}
            placeholder="YYYY-MM-DD"
            editable={props.mode === 'new' && !submitting}
            style={[
              styles.input,
              props.mode === 'justify' && styles.inputDisabled,
            ]}
          />

          <Text style={styles.label}>Motivo (opcional)</Text>
          <TextInput
            value={motivo}
            onChangeText={setMotivo}
            placeholder="Ex: consulta médica, mal-estar…"
            multiline
            numberOfLines={3}
            editable={!submitting}
            style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
          />

          <Text style={styles.label}>Anexo do atestado</Text>
          {file ? (
            <View style={styles.fileBox}>
              <Ionicons name="document-text" size={18} color={COLORS.PRIMARY} />
              <Text style={styles.fileName} numberOfLines={1}>
                {file.name}
              </Text>
              <TouchableOpacity onPress={() => setFile(null)} disabled={submitting}>
                <Ionicons name="close-circle" size={18} color={COLORS.ERROR} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.attachRow}>
              <TouchableOpacity
                style={styles.attachBtn}
                onPress={() => pickPhoto(true)}
                disabled={submitting}
              >
                <Ionicons name="camera-outline" size={18} color={COLORS.PRIMARY} />
                <Text style={styles.attachLabel}>Foto</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.attachBtn}
                onPress={() => pickPhoto(false)}
                disabled={submitting}
              >
                <Ionicons name="image-outline" size={18} color={COLORS.PRIMARY} />
                <Text style={styles.attachLabel}>Galeria</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.attachBtn}
                onPress={pickPdf}
                disabled={submitting}
              >
                <Ionicons
                  name="document-attach-outline"
                  size={18}
                  color={COLORS.PRIMARY}
                />
                <Text style={styles.attachLabel}>PDF</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnGhost]}
              onPress={handleClose}
              disabled={submitting}
            >
              <Text style={styles.btnGhostLabel}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnPrimaryLabel}>Enviar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.CARD,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingTop: 16,
    paddingBottom: Platform.select({ ios: 32, android: 20 }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.TEXT,
    backgroundColor: COLORS.BACKGROUND,
  },
  inputDisabled: {
    backgroundColor: COLORS.BORDER + '33',
    color: COLORS.TEXT_SECONDARY,
  },
  attachRow: {
    flexDirection: 'row',
    gap: 8,
  },
  attachBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    backgroundColor: COLORS.BACKGROUND,
  },
  attachLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  fileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  fileName: {
    flex: 1,
    fontSize: 13,
    color: COLORS.TEXT,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: COLORS.PRIMARY,
  },
  btnPrimaryLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  btnGhostLabel: {
    color: COLORS.TEXT,
    fontSize: 15,
    fontWeight: '600',
  },
});
