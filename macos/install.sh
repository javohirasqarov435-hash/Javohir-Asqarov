#!/bin/bash
# Dars Taymeri widgetini MacBook ish stoliga o'rnatadi.
# Ishga tushirish (Terminal'da):
#   bash -c "$(curl -fsSL https://raw.githubusercontent.com/javohirasqarov435-hash/Javohir-Asqarov/claude/dazzling-mayer-x1fgqx/macos/install.sh)"
set -e

RAW="https://raw.githubusercontent.com/javohirasqarov435-hash/Javohir-Asqarov/claude/dazzling-mayer-x1fgqx/macos/dars-taymeri.widget/index.jsx"
APP="/Applications/Übersicht.app"
WIDGETS="$HOME/Library/Application Support/Übersicht/widgets"

echo "==> 1/4 Übersicht ilovasini tekshiryapman..."
if [ ! -d "$APP" ]; then
  if command -v brew >/dev/null 2>&1; then
    echo "    Homebrew orqali o'rnatyapman..."
    brew install --cask ubersicht
  else
    echo "    Übersicht topilmadi. Yuklab olish sahifasini ochyapman."
    echo "    Yuklab oling, ZIP'ni oching va Übersicht'ni Applications papkasiga torting."
    open "https://tracesof.net/uebersicht/"
    read -r -p "    O'rnatib bo'lgach, shu yerga qaytib Enter bosing... " < /dev/tty
    if [ ! -d "$APP" ]; then
      echo "XATO: $APP topilmadi. Übersicht Applications papkasida ekanini tekshiring."
      exit 1
    fi
  fi
fi

echo "==> 2/4 Widgetni yuklab olyapman..."
mkdir -p "$WIDGETS/dars-taymeri.widget"
curl -fsSL "$RAW" -o "$WIDGETS/dars-taymeri.widget/index.jsx"

echo "==> 3/4 Übersicht'ni ishga tushiryapman..."
open -a "$APP"

echo "==> 4/4 Mac yoqilganda o'zi ochiladigan qilyapman..."
if osascript -e 'tell application "System Events" to get the name of every login item' 2>/dev/null | grep -q "bersicht"; then
  echo "    Allaqachon sozlangan."
else
  osascript -e "tell application \"System Events\" to make login item at end with properties {path:\"$APP\", hidden:true}" >/dev/null 2>&1 \
    || echo "    (Bu qadam o'tmadi — Übersicht belgisi → Preferences → 'Launch Übersicht when I login' ni qo'lda yoqing.)"
fi

echo
echo "Tayyor! Widget ekranning o'ng yuqori burchagida chiqadi."
echo "Ko'rinmasa: oynalarni yig'ing yoki menyu satridagi Übersicht belgisi → Refresh All Widgets."
