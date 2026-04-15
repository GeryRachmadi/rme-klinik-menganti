<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent Rules for RME Klinik Pratama Menganti

## Before Writing Any Code
1. Read CLAUDE.md for full project context
2. Check the Jira ticket being worked on
3. Follow the existing file and folder structure
4. Match the existing design system (colors, fonts, spacing)

## Code Conventions
- Use TypeScript strictly, no `any` unless absolutely necessary
- Use Tailwind CSS for all styling, no inline styles except for dynamic values
- Use lucide-react for all icons
- Use next/font/google for fonts (already configured in layout.tsx)
- Use server components by default, add "use client" only when needed
- Use next/navigation for redirects, never window.location except after signIn

## Database
- Always use prisma instance from @/lib/prisma
- Never instantiate PrismaClient directly in components or API routes
- Always use PrismaPg adapter

## Authentication
- Use auth() from @/lib/auth for server components
- Use useSession() from next-auth/react for client components
- Protect routes via layout.tsx not page.tsx

## Naming Conventions
- Files: kebab-case (e.g. patient-card.tsx)
- Components: PascalCase (e.g. PatientCard)
- Functions: camelCase (e.g. getPatientById)
- Database fields: camelCase matching Prisma schema