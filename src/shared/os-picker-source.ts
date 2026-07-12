/** Source the user chose in the PipeWire portal. */
export interface OsPickerSource {
  id: string;
  type: 'screen' | 'window';
  displayId?: string;
}
