(function () {
  "use strict";

  /* ======= MOTOR DE CÁLCULO (mismo que calculadoraaliciia.es) ======= */
  function normalizeNumber(str) {
    str = String(str).trim().replace(/\s/g, "");
    var neg = false;
    if (str.startsWith("-")) { neg = true; str = str.slice(1); }
    str = str.replace(",", ".");
    if (str === "" || str === ".") str = "0";
    var parts = str.split("."), intPart = parts[0], decPart = parts[1] || "";
    intPart = intPart.replace(/^0+(?=\d)/, "") || "0";
    decPart = decPart.replace(/0+$/, "");
    return { intPart: intPart, decPart: decPart, negative: neg, value: parseFloat((neg ? "-" : "") + intPart + (decPart ? "." + decPart : "")) };
  }
  function padDecimals(a, b) {
    var len = Math.max(a.decPart.length, b.decPart.length);
    return [a.decPart.padEnd(len, "0"), b.decPart.padEnd(len, "0"), len];
  }

  var T = {
    es: {
      title: "Calculadora Alicia",
      placeholder: 'Introduce una operación y pulsa "=".',
      procedure: "Procedimiento",
      badInput: "Escribe una operación como 12+8 o 7,5÷3.",
      divZero: "No se puede dividir entre cero.",
      carry: "escribo", carryWord: "llevo",
      lastCarry: "Bajo la última llevada: ",
      borrow: "Pido prestado",
      partialSum: "Suma de productos parciales: ",
      shifted: "desplazado", position: "posición(es)",
      down: "Bajo", filler: "(relleno)", rest: "resto",
      cta: "Ver calculadora completa en la web →",
      result: "Resultado",
      tabs: ["Básica", "%", "MCM/MCD", "Científica", "Álgebra", "Fracciones", "Matrices"]
    },
    en: {
      title: "Alicia Calculator",
      placeholder: 'Enter an operation and press "=".',
      procedure: "Procedure",
      badInput: "Type an operation like 12+8 or 7.5÷3.",
      divZero: "Cannot divide by zero.",
      carry: "write", carryWord: "carry",
      lastCarry: "Bring down the last carry: ",
      borrow: "Borrow",
      partialSum: "Sum of partial products: ",
      shifted: "shifted", position: "position(s)",
      down: "Bring down", filler: "(padding)", rest: "remainder",
      cta: "See the full calculator on the website →",
      result: "Result",
      tabs: ["Basic", "%", "LCM/GCD", "Scientific", "Algebra", "Fractions", "Matrices"]
    }
  };
  var currentLang = "es";

  function addSteps(numA, numB, lang) {
    var t = T[lang];
    var a = normalizeNumber(numA), b = normalizeNumber(numB);
    var pd = padDecimals(a, b), da = pd[0], db = pd[1], decLen = pd[2];
    var intLen = Math.max(a.intPart.length, b.intPart.length);
    var fullA = a.intPart.padStart(intLen, "0") + da, fullB = b.intPart.padStart(intLen, "0") + db;
    var carry = 0, resultDigits = [], steps = [];
    for (var i = fullA.length - 1; i >= 0; i--) {
      var da_ = parseInt(fullA[i]), db_ = parseInt(fullB[i]);
      var sum = da_ + db_ + carry, digit = sum % 10, newCarry = Math.floor(sum / 10);
      steps.push(da_ + " + " + db_ + (carry ? " + " + carry + " (" + t.carryWord + ")" : "") + " = " + sum + (newCarry ? " → " + t.carry + " " + digit + ", " + t.carryWord + " " + newCarry : " → " + t.carry + " " + digit));
      resultDigits.unshift(digit); carry = newCarry;
    }
    if (carry) { resultDigits.unshift(carry); steps.push(t.lastCarry + carry); }
    var resStr = resultDigits.join(""); var resInt = resStr.slice(0, resStr.length - decLen) || "0";
    var resDec = decLen ? resStr.slice(resStr.length - decLen) : "";
    resInt = resInt.replace(/^0+(?=\d)/, "") || "0";
    var sep = lang === "en" ? "." : ",";
    return { steps: steps, display: resInt + (resDec ? sep + resDec : "") };
  }
  function subSteps(numA, numB, lang) {
    var t = T[lang];
    var a = normalizeNumber(numA), b = normalizeNumber(numB), negResult = false;
    if (Math.abs(a.value) < Math.abs(b.value)) { var tmp = a; a = b; b = tmp; negResult = true; }
    var pd = padDecimals(a, b), da = pd[0], db = pd[1], decLen = pd[2];
    var intLen = Math.max(a.intPart.length, b.intPart.length);
    var fullA = a.intPart.padStart(intLen, "0") + da, fullB = b.intPart.padStart(intLen, "0") + db;
    var borrow = 0, resultDigits = [], steps = [];
    for (var i = fullA.length - 1; i >= 0; i--) {
      var da_ = parseInt(fullA[i]) - borrow, db_ = parseInt(fullB[i]), orig = fullA[i];
      borrow = 0;
      if (da_ < db_) { da_ += 10; borrow = 1; }
      var digit = da_ - db_;
      steps.push(borrow ? t.borrow + ": " + orig + " + 10 = " + da_ + "; " + da_ + " - " + db_ + " = " + digit : orig + " - " + db_ + " = " + digit);
      resultDigits.unshift(digit);
    }
    var resStr = resultDigits.join(""); var resInt = resStr.slice(0, resStr.length - decLen) || "0";
    var resDec = decLen ? resStr.slice(resStr.length - decLen) : "";
    resInt = resInt.replace(/^0+(?=\d)/, "") || "0";
    var sep = lang === "en" ? "." : ",";
    return { steps: steps, display: (negResult ? "-" : "") + resInt + (resDec ? sep + resDec : "") };
  }
  function mulSteps(numA, numB, lang) {
    var t = T[lang];
    var a = normalizeNumber(numA), b = normalizeNumber(numB);
    var decPlaces = a.decPart.length + b.decPart.length;
    var intA = BigInt(a.intPart + a.decPart);
    var bStr = (b.intPart + b.decPart).replace(/^0+(?=\d)/, "") || "0";
    var steps = [], partials = [];
    for (var i = bStr.length - 1; i >= 0; i--) {
      var digit = BigInt(bStr[i]);
      var partial = intA * digit * (10n ** BigInt(bStr.length - 1 - i));
      if (digit !== 0n) {
        steps.push(a.intPart + a.decPart + " × " + digit + " = " + (intA * digit) + (bStr.length - 1 - i > 0 ? " → " + t.shifted + " " + (bStr.length - 1 - i) + " " + t.position + ": " + partial : ""));
        partials.push(partial);
      }
    }
    if (partials.length === 0) partials.push(0n);
    var totalRaw = partials.reduce(function (x, y) { return x + y; }, 0n);
    steps.push(t.partialSum + partials.join(" + ") + " = " + totalRaw);
    var rawStr = totalRaw.toString().padStart(decPlaces + 1, "0");
    var intPartRes = rawStr.slice(0, rawStr.length - decPlaces) || "0";
    var decPartRes = decPlaces ? rawStr.slice(rawStr.length - decPlaces) : "";
    intPartRes = intPartRes.replace(/^0+(?=\d)/, "") || "0";
    var negative = (a.negative !== b.negative) && totalRaw !== 0n;
    var sep = lang === "en" ? "." : ",";
    return { steps: steps, display: (negative ? "-" : "") + intPartRes + (decPartRes ? sep + decPartRes : "") };
  }
  function divSteps(numA, numB, lang, maxDecimals) {
    var t = T[lang];
    maxDecimals = maxDecimals || 6;
    var a = normalizeNumber(numA), b = normalizeNumber(numB);
    if (b.value === 0) return { error: t.divZero };
    var shift = b.decPart.length;
    var divisorInt = BigInt(b.intPart + b.decPart);
    var dividendDigits = a.intPart + a.decPart;
    var steps = [], quotientDigits = [], remainder = 0n, i = 0, decimalStarted = false, decimalCount = 0;
    var seenRemainders = {}, periodic = false;
    var digitsArr = dividendDigits.split("").map(function (d) { return BigInt(d); });
    var totalIntLen = dividendDigits.length - a.decPart.length;
    var pointPos = totalIntLen + shift;
    while (true) {
      var digit = i < digitsArr.length ? digitsArr[i] : 0n;
      if (i === pointPos) { quotientDigits.push("."); decimalStarted = true; }
      remainder = remainder * 10n + digit;
      var qd = remainder / divisorInt, prod = qd * divisorInt, newRemainder = remainder - prod;
      steps.push(t.down + " " + digit + (i >= digitsArr.length ? " " + t.filler : "") + ": " + remainder + " ÷ " + divisorInt + " = " + qd + ", " + t.rest + " " + newRemainder);
      quotientDigits.push(qd.toString());
      remainder = newRemainder; i++;
      if (i >= digitsArr.length) {
        if (remainder === 0n) break;
        if (decimalStarted) decimalCount++;
        if (decimalCount >= maxDecimals) { periodic = true; break; }
        if (decimalStarted) {
          var rk = remainder.toString();
          if (seenRemainders[rk]) { periodic = true; break; }
          seenRemainders[rk] = true;
        }
      }
      if (i > digitsArr.length + maxDecimals + 2) { periodic = true; break; }
    }
    var qStr = quotientDigits.join("").replace(/^0+(?=\d)/, "");
    if (qStr.startsWith(".")) qStr = "0" + qStr;
    if (qStr === "") qStr = "0";
    var negative = a.negative !== b.negative;
    var sep = lang === "en" ? "." : ",";
    var display = (negative ? "-" : "") + qStr.replace(".", sep) + (periodic ? "…" : "");
    return { steps: steps, display: display, periodic: periodic };
  }
  function sqrtSteps(x, precision) {
    precision = precision || 4;
    x = Math.abs(parseFloat(String(x).replace(",", ".")));
    if (isNaN(x)) return { error: "Número inválido." };
    var steps = [], n = 0;
    while ((n + 1) * (n + 1) <= x) n++;
    steps.push(n + "² = " + (n * n) + " ≤ " + x + " < " + ((n + 1) * (n + 1)) + " = " + (n + 1) + "² → la raíz está entre " + n + " y " + (n + 1));
    var current = n, exact = (n * n === x);
    if (!exact) {
      var place = 0.1;
      for (var p = 1; p <= precision; p++) {
        var chosen = 0;
        for (var d = 0; d <= 9; d++) {
          var test = current + d * place;
          var sq = Math.round(test * test * 1e10) / 1e10;
          if (sq <= x + 1e-9) chosen = d; else break;
        }
        current = Math.round((current + chosen * place) * 1e10) / 1e10;
        steps.push("Cifra decimal " + p + ": probando " + current.toFixed(p) + " → " + current.toFixed(p) + "² = " + (current * current).toFixed(Math.min(precision + 2, 8)) + " " + ((current * current <= x) ? "≤" : ">") + " " + x);
        place = place / 10;
      }
      var sqCheck = Math.round(current * current * 1e6) / 1e6;
      exact = Math.abs(sqCheck - x) < 1e-6;
    }
    var display = String(current).replace(".", ",") + (exact ? "" : " (aprox.)");
    return { steps: steps, result: current, exact: exact, display: display };
  }
  function factorSteps(x) {
    x = Math.trunc(Math.abs(parseFloat(String(x).replace(",", "."))));
    if (!x || x < 2) return { error: "Introduce un número entero mayor que 1." };
    var n = x, steps = [], factors = [], d = 2;
    while (d * d <= n) {
      while (n % d === 0) { steps.push(n + " ÷ " + d + " = " + (n / d)); factors.push(d); n = n / d; }
      d++;
    }
    if (n > 1) { steps.push(n + " ÷ " + n + " = 1 (" + n + " es primo)"); factors.push(n); }
    var counts = {};
    factors.forEach(function (f) { counts[f] = (counts[f] || 0) + 1; });
    var display = Object.keys(counts).map(function (f) { return counts[f] > 1 ? f + "^" + counts[f] : f; }).join(" × ");
    return { steps: steps, factors: factors, display: display };
  }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }

  /* ======= UI GENERAL ======= */
  var $ = function (sel) { return document.querySelector(sel); };
  var langBtn = document.getElementById("caLangBtn");
  var logoEl = document.querySelector(".ca-logo");
  var ctaEl = document.getElementById("caFullLink");
  var tabButtons = document.querySelectorAll(".ca-tab");

  function applyStaticText() {
    var t = T[currentLang];
    logoEl.textContent = t.title;
    langBtn.textContent = currentLang === "es" ? "EN" : "ES";
    ctaEl.textContent = t.cta;
    tabButtons.forEach(function (btn, idx) { btn.textContent = t.tabs[idx]; });
    if (!lastResult) {
      stepsEl.innerHTML = '<div class="ca-steps-placeholder">' + t.placeholder + "</div>";
    }
  }

  tabButtons.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabButtons.forEach(function (t) { t.classList.remove("active"); });
      tab.classList.add("active");
      document.querySelectorAll(".ca-panel").forEach(function (p) { p.classList.remove("active"); });
      document.getElementById("panel-" + tab.dataset.panel).classList.add("active");
    });
  });

  /* ======= BÁSICA ======= */
  var exprEl = document.getElementById("caExpr");
  var valEl = document.getElementById("caVal");
  var errEl = document.getElementById("caError");
  var stepsEl = document.getElementById("caSteps");
  var keypad = document.getElementById("caKeypad");

  var buffer = "";
  var lastResult = null;
  var lastLabel = "";

  function renderExpr() { exprEl.textContent = buffer || "\u00A0"; }

  function renderSteps(result, opLabel) {
    var t = T[currentLang];
    if (result.error) {
      errEl.textContent = result.error;
      lastResult = null;
      stepsEl.innerHTML = '<div class="ca-steps-placeholder">' + t.placeholder + "</div>";
      return;
    }
    errEl.textContent = "";
    lastResult = result;
    lastLabel = opLabel;
    var html = '<div class="ca-steps-title">' + t.procedure + "</div>";
    result.steps.forEach(function (s) { html += '<div class="ca-step-line">' + s + "</div>"; });
    html += '<div class="ca-steps-result">' + t.result + ": " + opLabel + " = " + result.display + "</div>";
    stepsEl.innerHTML = html;
    valEl.textContent = result.display;
  }

  function evaluate() {
    var t = T[currentLang];
    var m = buffer.match(/^(-?[\d.,]+)\s*([+\-×÷])\s*(-?[\d.,]+)$/);
    if (!m) { errEl.textContent = t.badInput; return; }
    var a = m[1], op = m[2], b = m[3];
    var result, label = a + " " + op + " " + b;
    if (op === "+") result = addSteps(a, b, currentLang);
    else if (op === "−") result = subSteps(a, b, currentLang);
    else if (op === "×") result = mulSteps(a, b, currentLang);
    else result = divSteps(a, b, currentLang);
    renderSteps(result, label);
  }

  keypad.addEventListener("click", function (e) {
    var btn = e.target.closest("button"); if (!btn) return;
    var k = btn.dataset.k; errEl.textContent = "";
    if (k === "ac") {
      buffer = ""; lastResult = null; lastLabel = "";
      valEl.textContent = "0"; applyStaticText(); renderExpr(); return;
    }
    if (k === "back") { buffer = buffer.slice(0, -1); renderExpr(); return; }
    if (k === "rc") {
      var target = buffer.match(/[\d.,]+$/);
      target = target ? target[0] : buffer;
      if (!target) return;
      var r = sqrtSteps(target, 4);
      if (r.error) { errEl.textContent = r.error; return; }
      renderSteps({ steps: r.steps, display: r.display }, "RC(" + target + ")");
      buffer = String(r.result).replace(".", ","); renderExpr();
      return;
    }
    if (k === "fact") {
      var target2 = buffer.match(/[\d.,]+$/);
      target2 = target2 ? target2[0] : buffer;
      if (!target2) return;
      var r2 = factorSteps(target2);
      if (r2.error) { errEl.textContent = r2.error; return; }
      renderSteps({ steps: r2.steps, display: r2.display }, "Factoriza(" + target2 + ")");
      return;
    }
    if (k === "=") { evaluate(); return; }
    buffer += k; renderExpr();
  });

  langBtn.addEventListener("click", function () {
    currentLang = currentLang === "es" ? "en" : "es";
    applyStaticText();
    if (lastLabel) evaluate();
  });

  /* ======= PORCENTAJES ======= */
  document.getElementById("caPctSolve").addEventListener("click", function () {
    var pctError = document.getElementById("caPctError"), pctSteps = document.getElementById("caPctSteps");
    pctError.textContent = "";
    var mode = document.getElementById("caPctMode").value;
    var x = parseFloat(document.getElementById("caPctX").value.replace(",", "."));
    var y = parseFloat(document.getElementById("caPctY").value.replace(",", "."));
    if (isNaN(x) || isNaN(y)) { pctError.textContent = "Completa X e Y con números válidos."; return; }
    var lines = [], result, label;
    if (mode === "of") {
      lines.push(x + "% = " + x + " ÷ 100 = " + (x / 100));
      result = (x / 100) * y;
      lines.push((x / 100) + " × " + y + " = " + result);
      label = x + "% de " + y;
    } else if (mode === "is") {
      if (y === 0) { pctError.textContent = "Y no puede ser 0."; return; }
      result = (x / y) * 100;
      lines.push("(" + x + " ÷ " + y + ") × 100 = " + result.toFixed(4).replace(/0+$/, "").replace(/\.$/, "") + "%");
      label = x + " es este % de " + y;
    } else if (mode === "incr") {
      var delta = (x / 100) * y;
      lines.push(x + "% de " + y + " = " + delta);
      result = y + delta;
      lines.push(y + " + " + delta + " = " + result);
      label = y + " aumentado en " + x + "%";
    } else {
      var delta2 = (x / 100) * y;
      lines.push(x + "% de " + y + " = " + delta2);
      result = y - delta2;
      lines.push(y + " − " + delta2 + " = " + result);
      label = y + " disminuido en " + x + "%";
    }
    var rounded = Math.round(result * 1e6) / 1e6;
    var display = String(rounded).replace(".", ",") + (mode === "is" ? "%" : "");
    var html = '<div class="ca-steps-title">Procedimiento</div>';
    lines.forEach(function (l) { html += '<div class="ca-step-line">' + l + "</div>"; });
    html += '<div class="ca-steps-result">' + label + " = " + display + "</div>";
    pctSteps.innerHTML = html;
  });

  /* ======= MCM / MCD ======= */
  document.getElementById("caMcmSolve").addEventListener("click", function () {
    var mcmError = document.getElementById("caMcmError"), mcmSteps = document.getElementById("caMcmSteps");
    mcmError.textContent = "";
    var a = parseInt(document.getElementById("caMcmA").value), b = parseInt(document.getElementById("caMcmB").value);
    if (isNaN(a) || isNaN(b) || a < 1 || b < 1) { mcmError.textContent = "Introduce dos números enteros mayores que 0."; return; }
    var fa = factorSteps(a), fb = factorSteps(b);
    var d = gcd(a, b), m = Math.abs(a * b) / d;
    var lines = [];
    lines.push("Factorización de " + a + ": " + (fa.display || a));
    lines.push("Factorización de " + b + ": " + (fb.display || b));
    lines.push("MCD (máximo común divisor) de " + a + " y " + b + " = " + d);
    lines.push("MCM (mínimo común múltiplo) = (" + a + " × " + b + ") ÷ MCD = " + (a * b) + " ÷ " + d + " = " + m);
    var html = '<div class="ca-steps-title">Procedimiento</div>';
    lines.forEach(function (l) { html += '<div class="ca-step-line">' + l + "</div>"; });
    html += '<div class="ca-steps-result">MCD · MCM = ' + d + " · " + m + "</div>";
    mcmSteps.innerHTML = html;
  });

  /* ======= CIENTÍFICA ======= */
  var sciExpr = document.getElementById("caSciExpr"), sciVal = document.getElementById("caSciVal"), sciError = document.getElementById("caSciError"), sciBuf = "";
  function safeEvalSci(expr) {
    var e = expr
      .replace(/π/g, "Math.PI")
      .replace(/\^/g, "**")
      .replace(/sin\(/g, "Math.sin(")
      .replace(/cos\(/g, "Math.cos(")
      .replace(/tan\(/g, "Math.tan(")
      .replace(/log\(/g, "Math.log10(")
      .replace(/ln\(/g, "Math.log(")
      .replace(/sqrt\(/g, "Math.sqrt(");
    if (!/^[0-9+\-*/().\sA-Za-z]*$/.test(e)) throw new Error("Expresión inválida");
    var allowedTokens = e.replace(/Math\.(sin|cos|tan|log10|log|sqrt|PI)/g, "");
    if (/[A-Za-z]/.test(allowedTokens)) throw new Error("Expresión inválida");
    var val = Function('"use strict"; return (' + e + ")")();
    if (typeof val !== "number" || !isFinite(val)) throw new Error("Resultado no numérico");
    return val;
  }
  document.getElementById("caSciKeypad").addEventListener("click", function (e) {
    var btn = e.target.closest("button"); if (!btn) return;
    var k = btn.dataset.k; sciError.textContent = "";
    if (k === "ac") { sciBuf = ""; sciExpr.textContent = "\u00A0"; sciVal.textContent = "0"; return; }
    if (k === "back") { sciBuf = sciBuf.slice(0, -1); sciExpr.textContent = sciBuf || "\u00A0"; return; }
    if (k === "=") {
      try {
        var val = safeEvalSci(sciBuf);
        var rounded = Math.round(val * 1e8) / 1e8;
        sciVal.textContent = String(rounded).replace(".", ",");
      } catch (err) { sciError.textContent = "Expresión inválida. Revisa paréntesis y funciones."; }
      return;
    }
    sciBuf += k; sciExpr.textContent = sciBuf;
  });

  /* ======= ÁLGEBRA ======= */
  document.getElementById("caAlgSolve").addEventListener("click", function () {
    var algError = document.getElementById("caAlgError"), algSteps = document.getElementById("caAlgSteps");
    algError.textContent = "";
    var a = parseFloat(document.getElementById("caAlgA").value.replace(",", "."));
    var b = parseFloat(document.getElementById("caAlgB").value.replace(",", "."));
    var c = parseFloat(document.getElementById("caAlgC").value.replace(",", "."));
    if (isNaN(a) || isNaN(b) || isNaN(c)) { algError.textContent = "Completa los tres campos con números válidos."; return; }
    if (a === 0) { algError.textContent = "a no puede ser 0."; return; }
    var step1 = c - b, x = step1 / a;
    var lines = [
      "Ecuación: " + a + "x + " + b + " = " + c,
      "Resto " + b + " en ambos lados: " + a + "x = " + c + " − " + b + " = " + step1,
      "Divido ambos lados entre " + a + ": x = " + step1 + " ÷ " + a
    ];
    var display = String(Math.round(x * 1e6) / 1e6).replace(".", ",");
    var html = '<div class="ca-steps-title">Procedimiento</div>';
    lines.forEach(function (l) { html += '<div class="ca-step-line">' + l + "</div>"; });
    html += '<div class="ca-steps-result">x = ' + display + "</div>";
    algSteps.innerHTML = html;
  });

  /* ======= FRACCIONES ======= */
  function parseFraction(str) {
    var m = str.trim().split("/");
    if (m.length !== 2) return null;
    var num = parseInt(m[0]), den = parseInt(m[1]);
    if (isNaN(num) || isNaN(den) || den === 0) return null;
    return { num: num, den: den };
  }
  document.getElementById("caFrSolve").addEventListener("click", function () {
    var frError = document.getElementById("caFrError"), frSteps = document.getElementById("caFrSteps");
    frError.textContent = "";
    var f1 = parseFraction(document.getElementById("caFr1").value);
    var f2 = parseFraction(document.getElementById("caFr2").value);
    var op = document.getElementById("caFrOp").value;
    if (!f1 || !f2) { frError.textContent = "Escribe cada fracción como numerador/denominador (ej. 3/4)."; return; }
    var resNum, resDen, lines = [];
    if (op === "+" || op === "-") {
      var lcm = (f1.den * f2.den) / gcd(f1.den, f2.den);
      var n1 = f1.num * (lcm / f1.den), n2 = f2.num * (lcm / f2.den);
      resNum = op === "+" ? n1 + n2 : n1 - n2;
      resDen = lcm;
      lines.push("Denominador común (m.c.m. de " + f1.den + " y " + f2.den + "): " + lcm);
      lines.push(f1.num + "/" + f1.den + " = " + n1 + "/" + lcm + "   |   " + f2.num + "/" + f2.den + " = " + n2 + "/" + lcm);
      lines.push(n1 + " " + op + " " + n2 + " = " + resNum + "  →  " + resNum + "/" + resDen);
    } else if (op === "*") {
      resNum = f1.num * f2.num; resDen = f1.den * f2.den;
      lines.push("Multiplico numeradores: " + f1.num + " × " + f2.num + " = " + resNum);
      lines.push("Multiplico denominadores: " + f1.den + " × " + f2.den + " = " + resDen);
    } else {
      resNum = f1.num * f2.den; resDen = f1.den * f2.num;
      lines.push("Multiplico en cruz: " + f1.num + " × " + f2.den + " = " + resNum);
      lines.push(f1.den + " × " + f2.num + " = " + resDen);
    }
    var g = gcd(resNum, resDen);
    var simpNum = resNum / g, simpDen = resDen / g;
    if (g > 1) lines.push("Simplifico dividiendo entre el m.c.d. (" + g + "): " + simpNum + "/" + simpDen);
    var display = simpNum + "/" + simpDen;
    var html = '<div class="ca-steps-title">Procedimiento</div>';
    lines.forEach(function (l) { html += '<div class="ca-step-line">' + l + "</div>"; });
    html += '<div class="ca-steps-result">' + f1.num + "/" + f1.den + " " + op + " " + f2.num + "/" + f2.den + " = " + display + "</div>";
    frSteps.innerHTML = html;
  });

  /* ======= MATRICES ======= */
  function readMatrix(ids) { return ids.map(function (id) { return parseFloat(document.getElementById(id).value.replace(",", ".")); }); }
  function matResult(title, m) {
    document.getElementById("caMatSteps").innerHTML = '<div class="ca-steps-title">' + title + '</div>' +
      '<div class="ca-step-line" style="font-size:1.05rem;">| ' + m[0] + "  " + m[1] + " |</div>" +
      '<div class="ca-step-line" style="font-size:1.05rem;">| ' + m[2] + "  " + m[3] + " |</div>";
  }
  document.getElementById("caMatAdd").addEventListener("click", function () {
    var matError = document.getElementById("caMatError"); matError.textContent = "";
    var A = readMatrix(["caM1a", "caM1b", "caM1c", "caM1d"]), B = readMatrix(["caM2a", "caM2b", "caM2c", "caM2d"]);
    if (A.some(isNaN) || B.some(isNaN)) { matError.textContent = "Completa las 8 celdas con números válidos."; return; }
    var R = A.map(function (v, i) { return v + B[i]; });
    matResult("A + B =", R);
  });
  document.getElementById("caMatMul").addEventListener("click", function () {
    var matError = document.getElementById("caMatError"); matError.textContent = "";
    var A = readMatrix(["caM1a", "caM1b", "caM1c", "caM1d"]), B = readMatrix(["caM2a", "caM2b", "caM2c", "caM2d"]);
    if (A.some(isNaN) || B.some(isNaN)) { matError.textContent = "Completa las 8 celdas con números válidos."; return; }
    var R = [
      A[0] * B[0] + A[1] * B[2], A[0] * B[1] + A[1] * B[3],
      A[2] * B[0] + A[3] * B[2], A[2] * B[1] + A[3] * B[3]
    ];
    matResult("A × B =", R);
  });

  applyStaticText();

  if (ctaEl) {
    ctaEl.href = "https://calculadoraaliciia.es/?utm_source=extension&utm_medium=browser&utm_campaign=popup";
  }
})();
