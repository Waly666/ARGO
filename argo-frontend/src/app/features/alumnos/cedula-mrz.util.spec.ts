import { parseCedulaColombianaMrz } from './cedula-mrz.util';

const SAMPLE = [
  'ICCOL008176824852001<<<<<<<<<<',
  '7010103M3210204COL17344720<<<0',
  'DE<LA<PENA<MUNOZ<<JUAN<CARLOS<',
].join('\n');

describe('parseCedulaColombianaMrz', () => {
  it('extrae documento, nombres, género y fecha de nacimiento de una MRZ TD1', () => {
    expect(parseCedulaColombianaMrz(SAMPLE)).toEqual({
      tipoDoc: '1',
      numDoc: '17344720',
      apellido1: 'DE LA PENA',
      apellido2: 'MUNOZ',
      nombre1: 'JUAN',
      nombre2: 'CARLOS',
      genero: 'M',
      fechaNac: '1970-10-10',
    });
  });

  it('acepta el texto en una sola línea continua', () => {
    const compacto = SAMPLE.replace(/\n/g, '');
    expect(parseCedulaColombianaMrz(compacto)?.numDoc).toBe('17344720');
  });

  it('repara errores típicos de OCR', () => {
    const ocr =
      'ICCOLODB176824 85200 << G <<\n7010103M32 10204C0L17344720<<<0\nDE<LA<PENA<ML NOZ< FNECARLOS<';
    const parsed = parseCedulaColombianaMrz(ocr);
    expect(parsed?.numDoc).toBe('17344720');
    expect(parsed?.apellido1).toContain('PENA');
    expect(parsed?.nombre1).toBeTruthy();
  });

  it('extrae el NUIP completo sin el dígito verificador tras el relleno', () => {
    const specimen = [
      'ICCOL0000000012<<<<<<<<<<<<<<<',
      '8808213F3101300COL1234567890<9',
      'VELEZ<RUIZ<<GERONIMO<<<<<<<<<<<',
    ].join('\n');
    expect(parseCedulaColombianaMrz(specimen)).toEqual({
      tipoDoc: '1',
      numDoc: '1234567890',
      apellido1: 'VELEZ',
      apellido2: 'RUIZ',
      nombre1: 'GERONIMO',
      nombre2: undefined,
      genero: 'F',
      fechaNac: '1988-08-21',
    });
  });

  it('no pega el dígito verificador si el OCR omite el <', () => {
    const sinRelleno = [
      'ICCOL0000000012<<<<<<<<<<<<<<<',
      '8808213F3101300COL12345678909',
      'VELEZ<RUIZ<<GERONIMO<<<<<<<<<<<',
    ].join('\n');
    expect(parseCedulaColombianaMrz(sinRelleno)?.numDoc).toBe('1234567890');
  });

  it('rechaza texto que no es MRZ', () => {
    expect(parseCedulaColombianaMrz('hola mundo')).toBeNull();
    expect(parseCedulaColombianaMrz('PubDSK_1')).toBeNull();
  });
});
