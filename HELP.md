- Добавляем модель EmailVerificationToken
  model EmailVerificationToken {
  id        Int      @id @default(autoincrement())
  tokenHash String   @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())

  userId Int
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@map("email_verification_tokens")
  }
- npx prisma migrate dev --name add_email_verification

npx http-server . -p 5500

allow pasting
const siteKey = '6LdjKC8uAAAAAExkaiGfQ0dbV0PV4E7WmoN6uDjO';

const script = document.createElement('script');
script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;

script.onload = () => {
grecaptcha.ready(async () => {
try {
const token = await grecaptcha.execute(siteKey, {
action: 'register',
});

      console.log('reCAPTCHA TOKEN:', token);
    } catch (error) {
      console.error(error);
    }
});
};

script.onerror = () => console.error('Google reCAPTCHA failed to load');

document.head.appendChild(script);