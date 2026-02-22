import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // 👇 1 DÒNG DUY NHẤT: BẬT CHẾ ĐỘ "THÔNG CHỐT" CHO MÔI TRƯỜNG DEV
        return true; // <--- Thêm dòng này vào, bỏ qua mọi bước kiểm tra bên dưới!

        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.role) {
            throw new ForbiddenException('Không xác định được quyền hạn của bạn!');
        }

        const hasRole = requiredRoles.includes(user.role);
        if (!hasRole) {
            throw new ForbiddenException('Bạn KHÔNG CÓ QUYỀN thực hiện hành động này!');
        }

        return true;
    }
}