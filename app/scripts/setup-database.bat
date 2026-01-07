@echo off
echo ========================================
echo Setup PostgreSQL - SAL GOISC
echo ========================================
echo.

echo [1/4] Criando banco de dados 'saldogoisc'...
psql -U postgres -c "CREATE DATABASE saldogoisc;" 2>nul
if %errorlevel% equ 0 (
    echo ✓ Banco criado com sucesso!
) else (
    echo ℹ Banco já existe ou erro ao criar
)
echo.

echo [2/4] Gerando Prisma Client...
call npm run db:generate
echo.

echo [3/4] Executando migrações...
call npm run db:migrate
echo.

echo [4/4] Populando com dados iniciais...
call npm run db:seed
echo.

echo ========================================
echo ✓ Setup concluído!
echo ========================================
echo.
echo Próximo passo: npm run dev
echo.
pause
