import * as yup from 'yup';
import type { WordInput } from '../types';

export const EMAIL_PATTERN = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;
export const PASSWORD_PATTERN = /^(?=.*[a-zA-Z]{6})(?=.*\d)[a-zA-Z\d]{7}$/;
export const ENGLISH_PATTERN = /^[A-Za-z]+(?:['’-][A-Za-z]+)*(?: +[A-Za-z]+(?:['’-][A-Za-z]+)*)*$/;
export const TURKISH_PATTERN = /^[A-Za-zÇĞİÖŞÜçğıöşü]+(?:['’ʼ -][A-Za-zÇĞİÖŞÜçğıöşü]+)*$/u;

export const PASSWORD_HELP = '7 karakter kullan: art arda 6 harf ve 1 rakam.';

export interface AuthFormValues {
  name?: string;
  email: string;
  password: string;
}

export const loginSchema: yup.ObjectSchema<AuthFormValues> = yup.object({
  name: yup.string().optional(),
  email: yup
    .string()
    .trim()
    .required('E-posta adresini gir.')
    .matches(
      EMAIL_PATTERN,
      'ad@ornek.com biçiminde, alan adı uzantısı 2–3 harf olan bir adres gir.',
    ),
  password: yup.string().required('Şifreni gir.').matches(PASSWORD_PATTERN, PASSWORD_HELP),
});

export const registerSchema: yup.ObjectSchema<AuthFormValues> = loginSchema.shape({
  name: yup.string().trim().max(100, 'En fazla 100 karakter kullan.').required('Adını gir.'),
});

export const wordSchema: yup.ObjectSchema<WordInput> = yup.object({
  en: yup
    .string()
    .trim()
    .max(64, 'En fazla 64 karakter kullan.')
    .required('İngilizce kelimeyi gir.')
    .matches(ENGLISH_PATTERN, 'İngilizce harfler, boşluk, kesme işareti veya kısa çizgi kullan.'),
  tr: yup
    .string()
    .trim()
    .max(64, 'En fazla 64 karakter kullan.')
    .required('Türkçe karşılığını gir.')
    .matches(TURKISH_PATTERN, 'Türkçe harfler, boşluk, kesme işareti veya kısa çizgi kullan.'),
  category: yup.string().required('Bir kategori seç.'),
  isIrregular: yup.boolean().optional(),
});
