# Bidrag til monetos.me

Tak fordi du overvejer at bidrage til monetos.me! Alle former for bidrag er velkomne — fejlrettelser, nye funktioner, dokumentation eller feedback.

## Sådan bidrager du

1. **Fork** projektet på GitHub
2. **Opret en branch** til din ændring: `git checkout -b min-feature`
3. **Lav dine ændringer** og test dem lokalt
4. **Kør lint og build** for at sikre kvaliteten:
   ```bash
   npm run lint
   npm run build
   ```
5. **Commit** dine ændringer med en beskrivende besked
6. **Push** til din fork: `git push origin min-feature`
7. **Opret en Pull Request** mod `main`-branchen

## Rapporter fejl

Fandt du en fejl? Opret et [issue](https://github.com/olelundmaegbaek/monetos/issues/new?template=bug_report.md) med fejlrapport-skabelonen. Inkluder gerne:

- Trin til at genskabe fejlen
- Forventet vs. faktisk adfærd
- Browser og styresystem

## Foreslå funktioner

Har du en idé til en ny funktion? Opret et [issue](https://github.com/olelundmaegbaek/monetos/issues/new?template=feature_request.md) med funktionsforslag-skabelonen.

## Kodekonventioner

- **TypeScript** med strict mode — ingen `any` typer
- **UI-tekst** skrives på dansk
- **Kode og kommentarer** skrives på engelsk
- Brug eksisterende **shadcn/ui**-komponenter fra `src/components/ui/`
- Data gemmes i **localStorage** — ingen backend-afhængigheder
- Formatering følger projektets ESLint-konfiguration

## Udvikling

```bash
# Installer afhængigheder
npm install

# Start udviklingsserveren
npm run dev

# Kør linting
npm run lint

# Byg projektet
npm run build
```

Appen åbner på [http://localhost:3000](http://localhost:3000). Ved første besøg vises en opsætningsguide.
