import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Project } from "@/types/bom";
import type {
  ShoppingList,
  ShoppingListItem,
} from "@/lib/calculations/shoppingList";

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
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: "#6b7280",
  },
  storeSection: {
    marginBottom: 16,
  },
  storeName: {
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
  muted: {
    color: "#6b7280",
    fontSize: 8,
  },
  storeTotal: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
    paddingTop: 4,
  },
  storeTotalText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 8,
    borderTop: "2 solid #111",
  },
  grandTotalText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
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
  emptyStore: {
    fontSize: 9,
    color: "#9ca3af",
    padding: "4 6",
  },
});

function currency(n: number) {
  return `$${n.toFixed(2)}`;
}

function StoreSection({
  name,
  items,
}: {
  name: string;
  items: ShoppingListItem[];
}) {
  const total = items.reduce((sum, i) => sum + i.estimatedCost, 0);

  return (
    <View style={styles.storeSection}>
      <Text style={styles.storeName}>{name}</Text>

      {items.length === 0 ? (
        <Text style={styles.emptyStore}>No items</Text>
      ) : (
        <>
          <View style={styles.tableHeader}>
            <Text style={{ width: "45%", ...styles.cellBold }}>Item</Text>
            <Text style={{ width: "20%", ...styles.cellBold }}>Qty</Text>
            <Text style={{ width: "20%", ...styles.cellBold }}>Est. Cost</Text>
            <Text style={{ width: "15%", ...styles.cellBold }}>Notes</Text>
          </View>

          {items.map((item, i) => (
            <View
              key={i}
              style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
            >
              <Text style={{ width: "45%" }}>{item.description}</Text>
              <Text style={{ width: "20%" }}>{item.quantity}</Text>
              <Text style={{ width: "20%" }}>
                {currency(item.estimatedCost)}
              </Text>
              <Text style={{ width: "15%", ...styles.muted }}>
                {item.notes}
              </Text>
            </View>
          ))}

          <View style={styles.storeTotal}>
            <Text style={styles.storeTotalText}>
              Subtotal: {currency(total)}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

interface ShoppingListDocumentProps {
  project: Project;
  shoppingList: ShoppingList;
  isPro: boolean;
}

export function ShoppingListDocument({
  project,
  shoppingList,
  isPro,
}: ShoppingListDocumentProps) {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const grandTotal = [
    ...shoppingList.lumberYard,
    ...shoppingList.bigBox,
    ...shoppingList.specialty,
    ...shoppingList.anyStore,
  ].reduce((sum, i) => sum + i.estimatedCost, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {!isPro && (
          <View
            style={{
              position: "absolute",
              top: 12,
              left: 40,
              right: 40,
              fontSize: 8,
              color: "#9ca3af",
              textAlign: "center",
              borderBottom: "1 solid #f3f4f6",
              paddingBottom: 4,
            }}
            fixed
          >
            <Text>BoardFoot — boardfoot.app</Text>
          </View>
        )}

        <View style={styles.header}>
          <Text style={styles.projectName}>{project.name} — Shopping List</Text>
          <Text style={styles.subtitle}>
            Generated {date} · Prices are estimates
          </Text>
        </View>

        <StoreSection
          name="Lumber Yard / Hardwood Dealer"
          items={shoppingList.lumberYard}
        />
        <StoreSection
          name="Big Box Store (Home Depot / Lowe's)"
          items={shoppingList.bigBox}
        />
        <StoreSection
          name="Specialty (Rockler / Woodcraft)"
          items={shoppingList.specialty}
        />
        <StoreSection name="Any Store" items={shoppingList.anyStore} />

        <View style={styles.grandTotal}>
          <Text style={styles.grandTotalText}>Total Estimated Cost</Text>
          <Text style={styles.grandTotalText}>{currency(grandTotal)}</Text>
        </View>

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
