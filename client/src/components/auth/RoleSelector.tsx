import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { AdminGuard } from "./RoleGuard";

interface RoleSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  description?: string;
  disabled?: boolean;
}

/**
 * Role selector component for selecting user roles
 * Only administrators can change roles to admin or grant_writer
 */
export function RoleSelector({
  value,
  onChange,
  label = "Role",
  required = false,
  description,
  disabled = false,
}: RoleSelectorProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor="role-selector">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        name="role"
      >
        <SelectTrigger
          id="role-selector"
          className="w-full"
          aria-label="Select user role"
        >
          <SelectValue placeholder="Select role" />
        </SelectTrigger>
        <SelectContent>
          {/* Regular roles any manager can assign */}
          <SelectItem value="user">User</SelectItem>
          <SelectItem value="artist">Artist</SelectItem>
          <SelectItem value="manager">Manager</SelectItem>

          {/* Admin-only roles */}
          <AdminGuard>
            <SelectItem value="grant_writer">Grant Writer</SelectItem>
            <SelectItem value="admin">Administrator</SelectItem>
          </AdminGuard>
        </SelectContent>
      </Select>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}