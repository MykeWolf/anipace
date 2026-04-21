import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { SavedPlan, ScheduleWeek } from "@/types";

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG       = "#0f0f0f";
const SURFACE  = "#1a1a1a";
const BORDER   = "#2a2a2a";
const ACCENT   = "#8ab4f8";
const WHITE    = "#ffffff";
const MUTED    = "#9e9e9e";
const ROW_ALT  = "#161616";

const styles = StyleSheet.create({
  page: {
    backgroundColor: BG,
    fontFamily: "Helvetica",
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
  },

  // ── Top accent bar ──────────────────────────────────────────────────────────
  accentBar: {
    height: 4,
    backgroundColor: ACCENT,
    marginBottom: 0,
  },

  // ── Header block ───────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 40,
    paddingTop: 32,
    paddingBottom: 28,
    borderBottom: `1px solid ${BORDER}`,
  },
  brand: {
    fontSize: 7,
    color: ACCENT,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 16,
    fontFamily: "Helvetica-Bold",
  },
  title: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    marginBottom: 6,
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: 11,
    color: MUTED,
  },

  // ── Stats row ───────────────────────────────────────────────────────────────
  statsSection: {
    paddingHorizontal: 40,
    paddingTop: 24,
    paddingBottom: 24,
    flexDirection: "row",
    gap: 12,
    borderBottom: `1px solid ${BORDER}`,
  },
  statCard: {
    flex: 1,
    backgroundColor: SURFACE,
    borderRadius: 8,
    border: `1px solid ${BORDER}`,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  statLabel: {
    fontSize: 7,
    color: MUTED,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontFamily: "Helvetica",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    lineHeight: 1,
  },
  statUnit: {
    fontSize: 9,
    color: MUTED,
    marginTop: 3,
  },

  // ── Schedule table ──────────────────────────────────────────────────────────
  tableSection: {
    paddingHorizontal: 40,
    paddingTop: 24,
  },
  tableTitle: {
    fontSize: 9,
    color: MUTED,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: SURFACE,
    borderRadius: 6,
    marginBottom: 4,
  },
  headerCell: {
    fontSize: 7,
    color: MUTED,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  weekRow: {
    flexDirection: "row",
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 4,
    alignItems: "center",
  },
  weekRowAlt: {
    backgroundColor: ROW_ALT,
  },
  colWeek: { width: 56 },
  colDates: { flex: 1 },
  colEps: { width: 80 },
  weekLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
  },
  weekDates: {
    fontSize: 10,
    color: MUTED,
  },
  weekEps: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
    textAlign: "right",
  },
  restEps: {
    fontSize: 10,
    color: BORDER,
    textAlign: "right",
  },

  // ── Footer ──────────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerBrand: {
    fontSize: 7,
    color: BORDER,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  footerUrl: {
    fontSize: 7,
    color: BORDER,
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseLocal(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function shortDate(iso: string): string {
  return parseLocal(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function weekDateRange(week: ScheduleWeek): string {
  if (week.days.length === 0) return "";
  const first = parseLocal(week.days[0].date);
  const last = parseLocal(week.days[week.days.length - 1].date);
  const fm = first.toLocaleDateString("en-US", { month: "short" });
  const lm = last.toLocaleDateString("en-US", { month: "short" });
  const fd = first.getDate();
  const ld = last.getDate();
  return fm === lm ? `${fm} ${fd}-${ld}` : `${fm} ${fd} - ${lm} ${ld}`;
}

function weekEpRange(week: ScheduleWeek): string | null {
  const active = week.days.filter((d) => d.episodes !== null);
  if (active.length === 0) return null;
  return `Ep ${active[0].episodes!.from}-${active[active.length - 1].episodes!.to}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PlanPDF({ plan }: { plan: SavedPlan }) {
  const { summary } = plan;
  const dateRange = `${shortDate(plan.startDate)}  to  ${shortDate(summary.projectedFinishDate)}`;

  const stats = [
    { label: "Weeks", value: String(summary.totalWeeks), unit: "total" },
    { label: "Ep / week", value: summary.episodesPerWeekAvg.toFixed(1), unit: "average" },
    { label: "Watch time", value: summary.totalWatchHours.toFixed(1), unit: "hours" },
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Top accent bar */}
        <View style={styles.accentBar} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brand}>AniPace</Text>
          <Text style={styles.title}>{plan.animeTitle}</Text>
          <Text style={styles.subtitle}>
            {plan.totalEpisodes} episodes  {"\u00B7"}  {dateRange}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          {stats.map(({ label, value, unit }) => (
            <View key={label} style={styles.statCard}>
              <Text style={styles.statLabel}>{label}</Text>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statUnit}>{unit}</Text>
            </View>
          ))}
        </View>

        {/* Schedule table */}
        <View style={styles.tableSection}>
          <Text style={styles.tableTitle}>Week-by-week schedule</Text>

          {/* Header row */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.colWeek]}>Week</Text>
            <Text style={[styles.headerCell, styles.colDates]}>Dates</Text>
            <Text style={[styles.headerCell, styles.colEps, { textAlign: "right" }]}>Episodes</Text>
          </View>

          {/* Data rows */}
          {plan.weeks.map((week, i) => {
            const epRange = weekEpRange(week);
            const isAlt = i % 2 === 1;
            return (
              <View
                key={week.weekNumber}
                style={[styles.weekRow, isAlt ? styles.weekRowAlt : {}]}
              >
                <Text style={[styles.weekLabel, styles.colWeek]}>
                  {week.weekNumber}
                </Text>
                <Text style={[styles.weekDates, styles.colDates]}>
                  {weekDateRange(week)}
                </Text>
                <Text style={[epRange ? styles.weekEps : styles.restEps, styles.colEps]}>
                  {epRange ?? "Rest"}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerBrand}>AniPace</Text>
          <Text style={styles.footerUrl}>anipace.vercel.app</Text>
        </View>
      </Page>
    </Document>
  );
}
