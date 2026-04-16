import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type {
  Project,
  LumberItem,
  HardwareItem,
  FinishItem,
  ProjectLabor,
  UserProfile,
  ProjectTotals,
} from "@/types/bom";

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111",
  },
  header: {
    marginBottom: 20,
    borderBottom: "1 solid #e5e7eb",
    paddingBottom: 12,
  },
  projectName: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 9,
    color: "#6b7280",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    paddingBottom: 4,
    borderBottom: "1 solid #e5e7eb",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    padding: "4 6",
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    padding: "3 6",
    borderBottom: "1 solid #f3f4f6",
  },
  tableRowAlt: {
    flexDirection: "row",
    padding: "3 6",
    backgroundColor: "#fafafa",
    borderBottom: "1 solid #f3f4f6",
  },
  cellBold: {
    fontFamily: "Helvetica-Bold",
  },
  sectionTotal: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
    paddingTop: 4,
  },
  sectionTotalText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  divider: {
    borderBottom: "1 solid #e5e7eb",
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  summaryRowBold: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    fontFamily: "Helvetica-Bold",
  },
  summaryRowHighlight: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
  },
  muted: {
    color: "#6b7280",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#9ca3af",
    borderTop: "1 solid #f3f4f6",
    paddingTop: 6,
  },
  brandHeader: {
    position: "absolute",
    top: 12,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
    borderBottom: "1 solid #f3f4f6",
    paddingBottom: 4,
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function currency(n: number) {
  return `$${n.toFixed(2)}`;
}

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

// ─── Column width helpers ─────────────────────────────────────────────────────

const lumberCols = {
  species: "22%",
  thickness: "8%",
  width: "8%",
  length: "10%",
  qty: "6%",
  mode: "7%",
  price: "10%",
  bf: "10%",
  total: "19%",
};

const hardwareCols = {
  description: "45%",
  qty: "12%",
  unit: "13%",
  cost: "15%",
  total: "15%",
};

const finishCols = {
  description: "35%",
  containerSize: "13%",
  containerCost: "13%",
  amountUsed: "13%",
  unit: "11%",
  total: "15%",
};

// ─── Section Components ───────────────────────────────────────────────────────

function LumberSection({
  items,
  wasteFactor,
  totals,
}: {
  items: LumberItem[];
  wasteFactor: number;
  totals: ProjectTotals;
}) {
  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Lumber</Text>

      {/* Header */}
      <View style={styles.tableHeader}>
        <Text style={{ width: lumberCols.species, ...styles.cellBold }}>
          Species
        </Text>
        <Text style={{ width: lumberCols.thickness, ...styles.cellBold }}>
          T (in)
        </Text>
        <Text style={{ width: lumberCols.width, ...styles.cellBold }}>
          W (in)
        </Text>
        <Text style={{ width: lumberCols.length, ...styles.cellBold }}>
          Length
        </Text>
        <Text style={{ width: lumberCols.qty, ...styles.cellBold }}>Qty</Text>
        <Text style={{ width: lumberCols.mode, ...styles.cellBold }}>Mode</Text>
        <Text style={{ width: lumberCols.price, ...styles.cellBold }}>
          $/unit
        </Text>
        <Text style={{ width: lumberCols.bf, ...styles.cellBold }}>BF</Text>
        <Text
          style={{
            width: lumberCols.total,
            textAlign: "right",
            ...styles.cellBold,
          }}
        >
          Total
        </Text>
      </View>

      {/* Rows */}
      {items.map((item, i) => {
        const lengthFt =
          item.length_unit === "in" ? item.length_ft / 12 : item.length_ft;
        const bf =
          ((item.thickness_in * item.width_in * lengthFt) / 12) * item.quantity;
        const total =
          item.pricing_mode === "per_piece"
            ? item.price_per_unit * item.quantity
            : item.pricing_mode === "per_lf"
              ? (lengthFt * item.quantity) * item.price_per_unit
              : bf * item.price_per_unit;
        return (
          <View
            key={item.id}
            style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
          >
            <Text style={{ width: lumberCols.species }}>
              {item.species || "—"}
            </Text>
            <Text style={{ width: lumberCols.thickness }}>
              {item.thickness_in}"
            </Text>
            <Text style={{ width: lumberCols.width }}>{item.width_in}"</Text>
            <Text style={{ width: lumberCols.length }}>
              {item.length_ft} {item.length_unit ?? "ft"}
            </Text>
            <Text style={{ width: lumberCols.qty }}>{item.quantity}</Text>
            <Text style={{ width: lumberCols.mode }}>
              {item.pricing_mode === "per_piece" ? "pc" : item.pricing_mode === "per_lf" ? "LF" : "BF"}
            </Text>
            <Text style={{ width: lumberCols.price }}>
              {currency(item.price_per_unit)}
            </Text>
            <Text style={{ width: lumberCols.bf }}>{item.pricing_mode === "per_piece" ? "—" : bf.toFixed(2)}</Text>
            <Text style={{ width: lumberCols.total, textAlign: "right" }}>
              {currency(total)}
            </Text>
          </View>
        );
      })}

      {/* Footer */}
      <View style={styles.sectionTotal}>
        <Text style={{ ...styles.muted, marginRight: 16 }}>
          Net: {totals.lumber.boardFeetNet.toFixed(2)} BF —{" "}
          {currency(totals.lumber.netCost)}
        </Text>
        <Text style={styles.sectionTotalText}>
          Buy {totals.lumber.boardFeetAdjusted.toFixed(2)} BF for{" "}
          {pct(wasteFactor)} waste — {currency(totals.lumber.adjustedCost)}
        </Text>
      </View>
    </View>
  );
}

function HardwareSection({
  items,
  totals,
}: {
  items: HardwareItem[];
  totals: ProjectTotals;
}) {
  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Hardware</Text>

      <View style={styles.tableHeader}>
        <Text style={{ width: hardwareCols.description, ...styles.cellBold }}>
          Description
        </Text>
        <Text style={{ width: hardwareCols.qty, ...styles.cellBold }}>Qty</Text>
        <Text style={{ width: hardwareCols.unit, ...styles.cellBold }}>
          Unit
        </Text>
        <Text style={{ width: hardwareCols.cost, ...styles.cellBold }}>
          Cost
        </Text>
        <Text
          style={{
            width: hardwareCols.total,
            textAlign: "right",
            ...styles.cellBold,
          }}
        >
          Total
        </Text>
      </View>

      {items.map((item, i) => (
        <View
          key={item.id}
          style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
        >
          <Text style={{ width: hardwareCols.description }}>
            {item.description || "—"}
          </Text>
          <Text style={{ width: hardwareCols.qty }}>{item.quantity}</Text>
          <Text style={{ width: hardwareCols.unit }}>{item.unit}</Text>
          <Text style={{ width: hardwareCols.cost }}>
            {currency(item.unit_cost)}
          </Text>
          <Text style={{ width: hardwareCols.total, textAlign: "right" }}>
            {currency(item.quantity * item.unit_cost)}
          </Text>
        </View>
      ))}

      <View style={styles.sectionTotal}>
        <Text style={styles.sectionTotalText}>
          Hardware total: {currency(totals.hardware.total)}
        </Text>
      </View>
    </View>
  );
}

function FinishSection({
  items,
  totals,
}: {
  items: FinishItem[];
  totals: ProjectTotals;
}) {
  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Consumables</Text>

      <View style={styles.tableHeader}>
        <Text style={{ width: finishCols.description, ...styles.cellBold }}>
          Description
        </Text>
        <Text style={{ width: finishCols.containerSize, ...styles.cellBold }}>
          Container
        </Text>
        <Text style={{ width: finishCols.containerCost, ...styles.cellBold }}>
          Cost
        </Text>
        <Text style={{ width: finishCols.amountUsed, ...styles.cellBold }}>
          Used
        </Text>
        <Text style={{ width: finishCols.unit, ...styles.cellBold }}>Unit</Text>
        <Text
          style={{
            width: finishCols.total,
            textAlign: "right",
            ...styles.cellBold,
          }}
        >
          Total
        </Text>
      </View>

      {items.map((item, i) => (
        <View
          key={item.id}
          style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
        >
          <Text style={{ width: finishCols.description }}>
            {item.description || "—"}
          </Text>
          <Text style={{ width: finishCols.containerSize }}>
            {item.container_size ?? "—"}
          </Text>
          <Text style={{ width: finishCols.containerCost }}>
            {currency(item.container_cost)}
          </Text>
          <Text style={{ width: finishCols.amountUsed }}>
            {item.amount_used ?? "—"}
          </Text>
          <Text style={{ width: finishCols.unit }}>{item.unit}</Text>
          <Text style={{ width: finishCols.total, textAlign: "right" }}>
            {currency(item.container_cost * item.fraction_used)}
          </Text>
        </View>
      ))}

      <View style={styles.sectionTotal}>
        <Text style={styles.sectionTotalText}>
          Consumables total: {currency(totals.finish.total)}
        </Text>
      </View>
    </View>
  );
}

function CostSummarySection({
  totals,
  profile,
  wasteFactor,
  isPro,
}: {
  totals: ProjectTotals;
  profile: UserProfile;
  wasteFactor: number;
  isPro: boolean;
}) {
  const targetMargin = 0.3;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Cost Summary</Text>

      <View style={styles.summaryRow}>
        <Text>Lumber (net)</Text>
        <Text>{currency(totals.lumber.netCost)}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text>Lumber (adjusted for {pct(wasteFactor)} waste)</Text>
        <Text>{currency(totals.lumber.adjustedCost)}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text>Hardware</Text>
        <Text>{currency(totals.hardware.total)}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text>Consumables</Text>
        <Text>{currency(totals.finish.total)}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.summaryRowBold}>
        <Text>Materials subtotal</Text>
        <Text>{currency(totals.subtotal)}</Text>
      </View>

      {isPro && totals.labor.total > 0 && (
        <View style={styles.summaryRow}>
          <Text>Labor</Text>
          <Text>{currency(totals.labor.total)}</Text>
        </View>
      )}

      {isPro && totals.overhead.share > 0 && (
        <View style={styles.summaryRow}>
          <Text>Overhead share</Text>
          <Text>{currency(totals.overhead.share)}</Text>
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.summaryRowBold}>
        <Text>Grand Total (COGS)</Text>
        <Text>{currency(totals.grandTotal)}</Text>
      </View>

      {profile.tax_rate > 0 && (
        <View style={styles.summaryRow}>
          <Text>With tax ({pct(profile.tax_rate)})</Text>
          <Text>{currency(totals.withTax)}</Text>
        </View>
      )}

      <View style={styles.summaryRowHighlight}>
        <Text>Suggested retail ({pct(targetMargin)} margin)</Text>
        <Text>{currency(totals.suggestedRetail)}</Text>
      </View>
    </View>
  );
}

// ─── Main Document ────────────────────────────────────────────────────────────

interface BomDocumentProps {
  project: Project;
  lumberItems: LumberItem[];
  hardwareItems: HardwareItem[];
  finishItems: FinishItem[];
  labor: ProjectLabor | null;
  profile: UserProfile;
  totals: ProjectTotals;
  isPro: boolean;
}

export function BomDocument({
  project,
  lumberItems,
  hardwareItems,
  finishItems,
  labor,
  profile,
  totals,
  isPro,
}: BomDocumentProps) {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        {!isPro && (
          <View style={styles.brandHeader} fixed>
            <Text>BoardFoot — boardfoot.app</Text>
          </View>
        )}
        <View style={styles.header}>
          <Text style={styles.projectName}>{project.name}</Text>
          <Text style={styles.dateText}>Generated {date}</Text>
          {project.notes && (
            <Text style={{ ...styles.dateText, marginTop: 4 }}>
              {project.notes}
            </Text>
          )}
        </View>

        {/* BOM Sections */}
        <LumberSection
          items={lumberItems}
          wasteFactor={project.waste_factor}
          totals={totals}
        />
        <HardwareSection items={hardwareItems} totals={totals} />
        <FinishSection items={finishItems} totals={totals} />

        <View style={styles.divider} />

        <CostSummarySection
          totals={totals}
          profile={profile}
          wasteFactor={project.waste_factor}
          isPro={isPro}
        />

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>{project.name}</Text>
          {!isPro ? (
            <Text>Generated with BoardFoot — boardfoot.app</Text>
          ) : (
            <Text>{date}</Text>
          )}
        </View>
      </Page>
    </Document>
  );
}
