export enum VehicleType {
    BOAT = 'BOAT',
    CAR = 'CAR',
    HELICOPTER = 'HELICOPTER',
    TRUCK = 'TRUCK',
    CANOE = 'CANOE',
    OTHER = 'OTHER'
}

export enum VehicleStatus {
    AVAILABLE = 'AVAILABLE',     // Đang rảnh rỗi (Nằm ở kho)
    IN_USE = 'IN_USE',           // Đang đi cứu hộ (Đã giao cho Đội)
    MAINTENANCE = 'MAINTENANCE', // Đang bảo dưỡng
    BROKEN = 'BROKEN'            // Đang hỏng chờ sửa
}