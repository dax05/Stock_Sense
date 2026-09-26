import { useOperations, useProducts } from "../../hooks/useOperations";
import OperationList from "../../components/operations/OperationList";

export default function ReceiptsPage() {
    const { operations, loading, refetch } = useOperations("IN");
    const products = useProducts();

    return (
        <OperationList
            title="Receipts"
            opType="IN"
            operations={operations}
            loading={loading}
            products={products}
            onRefetch={refetch}
        />
    );
}
