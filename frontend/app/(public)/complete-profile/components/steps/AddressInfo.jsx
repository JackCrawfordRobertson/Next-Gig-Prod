"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function AddressInfo({
  address,
  onAddressChange
}) {
  return (
    <div className="space-y-4" aria-labelledby="address-info-heading">
      <h2 id="address-info-heading" className="sr-only">Address Information</h2>
      
      <div className="grid grid-cols-4 gap-2">
        <div className="col-span-2">
          <Label htmlFor="address-line1" className="text-xs">
            Address Line 1 <span aria-hidden="true">*</span>
          </Label>
          <Input
            id="address-line1"
            placeholder="First Line of Address"
            value={address.firstLine}
            onChange={(e) => onAddressChange("firstLine", e.target.value)}
            aria-required="true"
            autoComplete="address-line1"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="address-line2" className="text-xs">
            Address Line 2 <span className="text-gray-400">(Optional)</span>
          </Label>
          <Input
            id="address-line2"
            placeholder="Second Line of Address"
            value={address.secondLine}
            onChange={(e) => onAddressChange("secondLine", e.target.value)}
            autoComplete="address-line2"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        <div className="col-span-2">
          <Label htmlFor="city" className="text-xs">
            City <span aria-hidden="true">*</span>
          </Label>
          <Input
            id="city"
            placeholder="City"
            value={address.city}
            onChange={(e) => onAddressChange("city", e.target.value)}
            aria-required="true"
            autoComplete="address-level2"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="postcode" className="text-xs">
            Postcode <span aria-hidden="true">*</span>
          </Label>
          <Input
            id="postcode"
            placeholder="Postcode"
            value={address.postcode}
            onChange={(e) => onAddressChange("postcode", e.target.value)}
            aria-required="true"
            autoComplete="postal-code"
          />
        </div>
      </div>
    </div>
  );
}