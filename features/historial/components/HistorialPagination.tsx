import { Pressable, Text, View } from "react-native";

interface HistorialPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function HistorialPagination({ page, totalPages, onPageChange }: HistorialPaginationProps) {
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <View className="flex-row items-center justify-between px-4 py-3">
      <Pressable
        onPress={() => onPageChange(page - 1)}
        disabled={isFirst}
        className={`h-9 items-center justify-center rounded-[10px] bg-primary px-4 ${
          isFirst ? "opacity-40" : ""
        }`}
      >
        <Text className="text-[12.5px] font-semibold text-white">Anterior</Text>
      </Pressable>
      <Text className="text-[12.5px] font-semibold text-body">
        Página {page} de {totalPages}
      </Text>
      <Pressable
        onPress={() => onPageChange(page + 1)}
        disabled={isLast}
        className={`h-9 items-center justify-center rounded-[10px] bg-ink px-4 ${
          isLast ? "opacity-50" : ""
        }`}
      >
        <Text className="text-[12.5px] font-semibold text-white">Siguiente</Text>
      </Pressable>
    </View>
  );
}
