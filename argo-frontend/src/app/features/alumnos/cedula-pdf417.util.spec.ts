import { parseCedulaColombianaPdf417 } from './cedula-pdf417.util';

function payloadCedula(overrides: Record<number, string> = {}): string {
  const chars = Array<string>(200).fill('\u0000');
  const put = (start: number, value: string) => {
    [...value].forEach((char, i) => {
      chars[start + i] = char;
    });
  };
  put(24, 'PubDSK_1');
  put(48, '0123456789');
  put(58, 'PEREZ');
  put(81, 'GOMEZ');
  put(104, 'MARIA');
  put(127, 'ELENA');
  put(151, 'F');
  put(152, '19910529');
  put(166, 'O+');
  Object.entries(overrides).forEach(([start, value]) => put(Number(start), value));
  return chars.join('');
}

describe('parseCedulaColombianaPdf417', () => {
  it('extrae los datos civiles y elimina ceros iniciales del documento', () => {
    expect(parseCedulaColombianaPdf417(payloadCedula())).toEqual({
      tipoDoc: '1',
      numDoc: '123456789',
      apellido1: 'PEREZ',
      apellido2: 'GOMEZ',
      nombre1: 'MARIA',
      nombre2: 'ELENA',
      genero: 'F',
      fechaNac: '1991-05-29',
      tipoSangre: 'O+',
    });
  });

  it('rechaza datos que no pertenecen a una cédula colombiana', () => {
    expect(parseCedulaColombianaPdf417('PDF417 de otro documento')).toBeNull();
  });

  it('omite una fecha de nacimiento inválida sin rechazar los demás datos', () => {
    const parsed = parseCedulaColombianaPdf417(payloadCedula({ 152: '19911345' }));
    expect(parsed?.numDoc).toBe('123456789');
    expect(parsed?.fechaNac).toBeUndefined();
  });
});
