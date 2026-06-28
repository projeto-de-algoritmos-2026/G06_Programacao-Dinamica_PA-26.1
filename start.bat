@echo off
setlocal

set PORT=%PORT%
if "%PORT%"=="" set PORT=8000

where py >nul 2>nul
if %errorlevel%==0 (
  set PYTHON_CMD=py -3
) else (
  where python >nul 2>nul
  if %errorlevel%==0 (
    set PYTHON_CMD=python
  ) else (
    echo Erro: Python nao encontrado. Instale o Python 3 e tente novamente.
    exit /b 1
  )
)

echo Iniciando servidor local em http://localhost:%PORT%
echo Pressione Ctrl+C para encerrar.

%PYTHON_CMD% -m http.server %PORT%
