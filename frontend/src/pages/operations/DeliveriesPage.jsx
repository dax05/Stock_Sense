import { useOperations, useProducts } from "../../hooks/useOperations";
import OperationList from "../../components/operations/OperationList";

export default function DeliveriesPage() {
    const { operations, loading, refetch } = useOperations("OUT");
    const products = useProducts();

    return (
        <OperationList
            title="Deliveries"
            opType="OUT"
            operations={operations}
            loading={loading}
            products={products}
            onRefetch={refetch}
        />
    );
}
