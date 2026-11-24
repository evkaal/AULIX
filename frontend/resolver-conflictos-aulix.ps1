# resolver-conflictos-aulix.ps1 — resuelve los conflictos de merge de AULIX.
# Uso (PowerShell, desde la carpeta frontend):
#   powershell -ExecutionPolicy Bypass -File C:\Users\ejim1\Downloads\resolver-conflictos-aulix.ps1
# O si el archivo está en la carpeta frontend:
#   .\resolver-conflictos-aulix.ps1
#
# Qué resuelve:
#  - AuthContext.jsx: mezcla la versión con loginWithGoogle (nuestra) y la
#    versión con rol/rolLabel/updateUser (del compañero).
#  - Login.jsx: conserva handleGoogleLogin Y entrarDemo (las dos funciones),
#    y se queda con el botón real de Google (no el de "próximamente").
# Crea .bak de cada archivo antes de modificarlo y verifica que no queden
# marcadores de conflicto. Si algo no cuadra, no escribe nada roto.

$ErrorActionPreference = 'Stop'
$utf8 = [System.Text.Encoding]::UTF8
$utf8SinBom = New-Object System.Text.UTF8Encoding $false

if (-not (Test-Path 'src/context/AuthContext.jsx') -or -not (Test-Path 'src/pages/Login.jsx')) {
    Write-Host 'ERROR: ejecuta este script desde la carpeta frontend (donde esta src/).'
    Write-Host 'Primero: cd C:\Users\ejim1\Documentos\aulix\Aulix\frontend'
    exit 1
}

function Split-Conflictos($lineas) {
    $segmentos = New-Object System.Collections.Generic.List[object]
    $i = 0
    while ($i -lt $lineas.Count) {
        $linea = $lineas[$i]
        if ($linea -match '^\s*<<<<<<< ') {
            $head = New-Object System.Collections.Generic.List[string]
            $incoming = New-Object System.Collections.Generic.List[string]
            $i++
            while ($i -lt $lineas.Count -and $lineas[$i] -notmatch '^\s*=======\s*$') { $head.Add($lineas[$i]); $i++ }
            if ($i -ge $lineas.Count) { throw 'Falta la linea ======= del conflicto.' }
            $i++
            while ($i -lt $lineas.Count -and $lineas[$i] -notmatch '^\s*>>>>>>>\s') { $incoming.Add($lineas[$i]); $i++ }
            if ($i -ge $lineas.Count) { throw 'Falta la linea >>>>>>> del conflicto.' }
            $i++
            $segmentos.Add(@{ Tipo = 'conflicto'; Head = $head; Incoming = $incoming })
        } else {
            $texto = New-Object System.Collections.Generic.List[string]
            while ($i -lt $lineas.Count -and $lineas[$i] -notmatch '^\s*<<<<<<< ') { $texto.Add($lineas[$i]); $i++ }
            $segmentos.Add(@{ Tipo = 'texto'; Lineas = $texto })
        }
    }
    return $segmentos
}

function Verificar-Y-Escribir($ruta, $lineas, $debeContener) {
    $texto = $lineas -join "`n"
    if ($texto -match '<<<<<<<|>>>>>>>' -or ($lineas | Where-Object { $_ -match '^\s*=======\s*$' })) {
        throw "$ruta : todavia quedan marcadores de conflicto."
    }
    foreach ($clave in $debeContener) {
        if ($texto -notmatch [regex]::Escape($clave)) { throw "$ruta : falta '$clave' despues de resolver." }
    }
    Copy-Item $ruta "$ruta.bak" -Force
    [System.IO.File]::WriteAllLines((Resolve-Path $ruta).Path, $lineas, $utf8SinBom)
}

function Resolver-AuthContext {
    $ruta = 'src/context/AuthContext.jsx'
    $lineas = [System.IO.File]::ReadAllLines((Resolve-Path $ruta).Path, $utf8)
    $segmentos = Split-Conflictos $lineas
    $conflictos = @($segmentos | Where-Object { $_.Tipo -eq 'conflicto' })
    if ($conflictos.Count -eq 0) { Write-Host 'AuthContext.jsx: sin conflicto, no se toca.'; return }
    if ($conflictos.Count -ne 1) { throw 'AuthContext.jsx: se esperaba 1 conflicto.' }
    $c = $conflictos[0]
    $headTxt = $c.Head -join "`n"
    $incTxt = $c.Incoming -join "`n"
    if ($headTxt -notmatch 'loginWithGoogle' -or $incTxt -notmatch 'updateUser') { throw 'AuthContext.jsx: el conflicto no es el esperado.' }
    $salida = New-Object System.Collections.Generic.List[string]
    foreach ($s in $segmentos) {
        if ($s.Tipo -eq 'texto') { foreach ($l in $s.Lineas) { $salida.Add($l) } }
        else {
            $salida.Add("    () => ({ user, token: session?.token ?? null, isAuthenticated: !!session?.token, rol: user?.rol ?? null, rolLabel: user?.rol ? ROLE_LABEL[user.rol] ?? user.rol : '', login, loginWithGoogle, register, logout, updateUser }),")
            $salida.Add("    [session, user, login, loginWithGoogle, register, logout, updateUser],")
        }
    }
    Verificar-Y-Escribir $ruta $salida @('loginWithGoogle', 'updateUser', 'rolLabel')
    Write-Host 'AuthContext.jsx: resuelto (loginWithGoogle + rol/rolLabel/updateUser).'
}

function Resolver-Login {
    $ruta = 'src/pages/Login.jsx'
    $lineas = [System.IO.File]::ReadAllLines((Resolve-Path $ruta).Path, $utf8)
    $textoCompleto = $lineas -join "`n"
    if ($textoCompleto -notmatch 'gusto verte') { throw 'Login.jsx: no se leyo bien el archivo (codificacion). No se toca nada.' }
    $segmentos = Split-Conflictos $lineas
    $conflictos = @($segmentos | Where-Object { $_.Tipo -eq 'conflicto' })
    if ($conflictos.Count -eq 0) { Write-Host 'Login.jsx: sin conflicto, no se toca.'; return }
    if ($conflictos.Count -ne 2) { throw 'Login.jsx: se esperaban 2 conflictos.' }
    $salida = New-Object System.Collections.Generic.List[string]
    $n = 0
    $saltarLlave = $false
    for ($si = 0; $si -lt $segmentos.Count; $si++) {
        $s = $segmentos[$si]
        if ($s.Tipo -eq 'texto') {
            $primera = $true
            foreach ($l in $s.Lineas) {
                if ($primera -and $saltarLlave -and $l -eq '  }') { $saltarLlave = $false; continue }
                $primera = $false
                $salida.Add($l)
            }
            $saltarLlave = $false
            continue
        }
        $n++
        if ($n -eq 1) {
            $headTxt = $s.Head -join "`n"
            $incTxt = $s.Incoming -join "`n"
            if ($headTxt -notmatch 'handleGoogleLogin' -or $incTxt -notmatch 'entrarDemo') { throw 'Login.jsx: el primer conflicto no es el esperado.' }
            foreach ($l in $s.Head) { $salida.Add($l) }
            $salida.Add('  }')
            $salida.Add('')
            foreach ($l in $s.Incoming) { $salida.Add($l) }
            $salida.Add('  }')
            # La llave que seguia al marcador cerraba una de las dos funciones;
            # como cada una ya tiene la suya, esa llave sobra.
            $saltarLlave = $true
        } elseif ($n -eq 2) {
            $headTxt = $s.Head -join "`n"
            $incTxt = $s.Incoming -join "`n"
            if ($headTxt -notmatch 'handleGoogleLogin' -or $incTxt -notmatch 'comingSoon') { throw 'Login.jsx: el segundo conflicto no es el esperado.' }
            foreach ($l in $s.Head) {
                $boton = $l -replace 'className="btn-google"', 'className="btn-google login2__google"'
                $salida.Add($boton)
            }
        } else {
            throw 'Login.jsx: hay mas conflictos de los esperados.'
        }
    }
    Verificar-Y-Escribir $ruta $salida @('handleGoogleLogin', 'entrarDemo', 'Continuar con Google')
    Write-Host 'Login.jsx: resuelto (handleGoogleLogin + entrarDemo, boton real de Google).'
}

try {
    Resolver-AuthContext
    Resolver-Login
    Write-Host ''
    Write-Host 'Listo. Ahora corre: npm run build'
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    Write-Host 'No se escribio nada roto. Los .bak conservan los archivos originales.'
    exit 1
}
