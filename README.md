# 🏥 MedSAS - Enterprise Multi-Tenant SaaS Platform

Modern, ölçeklenebilir, kurumsal sınıf çok kiracılı SaaS platformu.

## 🚀 Hızlı Başlangıç

### Ön Gereksinimler
- Node.js 20+ LTS
- npm 10+
- Docker & Docker Compose
- Git

### 📦 Kurulum

```bash
# Repository'yi klonlayın
git clone <repository-url>
cd medsas

# Dependencies kurulumu
npm install

# Environment dosyasını kopyalayın
cp .env.example .env

# Docker services başlatın
npm run docker:core

# Projeyi build edin
npm run build
```

### 🔧 Development

```bash
# Core servisleri başlat (PostgreSQL + Redis)
npm run docker:core

# Tüm servisleri başlat (monitoring dahil)
npm run docker:dev

# Development modunda çalıştır
npm run dev

# Testleri çalıştır
npm run test

# Code quality check
npm run lint
npm run type-check
```

### 🐳 Docker Commands

```bash
# Core services (DB + Cache)
npm run docker:core

# Development environment
npm run docker:dev

# Full stack (tüm monitoring dahil)
npm run docker:full

# Servisleri durdur
npm run docker:down

# Volumes ile beraber temizle
npm run docker:clean

# Service durumunu kontrol et
npm run docker:status

# Logları izle
npm run docker:logs
```

## 🏗️ Proje Yapısı

```
medsas/
├── apps/                      # Frontend Applications
│   ├── web/                   # Next.js Web App
│   ├── mobile/                # React Native Expo
│   ├── admin/                 # Admin Dashboard
│   └── api-gateway/           # API Gateway
├── services/                  # Microservices
│   ├── identity/              # Auth & Authorization
│   ├── tenant/                # Multi-tenant Management
│   ├── billing/               # Payment & Subscriptions
│   ├── notification/          # Email, Push, SMS
│   └── reporting/             # Analytics & Reports
├── packages/                  # Shared Libraries
│   ├── types/                 # TypeScript Types
│   ├── ui/                    # UI Components
│   ├── auth-sdk/              # Authentication SDK
│   ├── database/              # Database Schemas
│   ├── config/                # Configurations
│   ├── utils/                 # Utilities
│   ├── policy/                # Authorization Policies
│   ├── telemetry/             # Monitoring
│   └── audit-logger/          # Audit Trails
├── tools/                     # Development Tools
├── tests/                     # E2E & Integration Tests
├── infrastructure/            # Docker, K8s, Terraform
└── docs/                      # Documentation
```

## 💻 Technology Stack

### Frontend
- **Web**: Next.js 14 + TypeScript + Hero UI + Tailwind CSS
- **Mobile**: React Native Expo + TypeScript
- **State Management**: Zustand + TanStack Query
- **Forms**: React Hook Form + Zod validation

### Backend
- **Runtime**: Node.js 20+ LTS
- **Framework**: Express.js/Fastify + TypeScript
- **Database**: PostgreSQL 16 + Prisma ORM
- **Cache**: Redis 7
- **Message Queue**: NATS/Kafka
- **Authentication**: JWT + bcrypt

### DevOps
- **Monorepo**: Turborepo
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes + Helm
- **Monitoring**: Prometheus + Grafana + Jaeger
- **Logging**: ELK Stack
- **IaC**: Terraform

### Testing
- **Unit**: Jest
- **E2E**: Playwright
- **Integration**: Supertest
- **Load**: K6/Artillery

## 🔐 Güvenlik Özellikleri

- ✅ Multi-tenant data isolation
- ✅ Role-based access control (RBAC)
- ✅ JWT authentication with refresh tokens
- ✅ Password policies & MFA support
- ✅ Rate limiting & DDoS protection
- ✅ Input validation & sanitization
- ✅ Audit logging
- ✅ OWASP compliance

## 👥 User Roles

1. **Super Admin** - Global sistem yönetimi
2. **Tenant Admin** - Kiracı-özel yönetim
3. **Tenant User** - Sınırlı izinlerle kullanıcı

## 🚀 Deployment

### Development
```bash
npm run docker:dev
npm run dev
```

### Production
```bash
# Build all packages
npm run build

# Deploy with Docker
docker-compose -f docker-compose.prod.yml up -d

# Or with Kubernetes
kubectl apply -f infrastructure/kubernetes/
```

## 📊 Monitoring & Health Checks

- **Prometheus Metrics**: http://localhost:9090
- **Grafana Dashboards**: http://localhost:3003 (admin/admin123)
- **Jaeger Tracing**: http://localhost:16686
- **Kibana Logs**: http://localhost:5601

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage

# Load testing
npm run test:load
```

## 📝 Environment Variables

Tüm environment variables için `.env.example` dosyasına bakın.

Key variables:
- `DATABASE_URL`: PostgreSQL connection
- `REDIS_URL`: Redis connection
- `JWT_SECRET`: JWT secret key
- `NODE_ENV`: Environment (development/production)

## 🔄 Versioning & Releases

Bu proje [Changesets](https://github.com/changesets/changesets) kullanır:

```bash
# Yeni changeset oluştur
npm run changeset

# Versiyonları güncelle
npm run version-packages

# Release yap
npm run release
```

## 🤝 Contributing

1. Feature branch oluşturun
2. Değişikliklerinizi yapın
3. Test yazın
4. Changeset ekleyin
5. Pull request oluşturun

## 📋 TODO

- [ ] Next.js web uygulaması
- [ ] React Native mobil uygulama
- [ ] Identity service
- [ ] Tenant management service
- [ ] Billing service
- [ ] Notification service
- [ ] Admin dashboard
- [ ] E2E testing setup
- [ ] CI/CD pipeline
- [ ] Production deployment

## 📚 Documentation

- [Architecture Decision Records](./docs/architecture/)
- [API Documentation](./docs/api/)
- [Deployment Guide](./docs/deployment/)
- [Development Guide](./docs/development/)

## 🛟 Support

- GitHub Issues için: [Issues](https://github.com/medsas/platform/issues)
- Dokümantasyon: [Wiki](https://github.com/medsas/platform/wiki)

## 📄 License

MIT License - detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

**Built with ❤️ by MedSAS Team**