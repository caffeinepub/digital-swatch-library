import Float "mo:core/Float";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

actor {
  // ── Types ──────────────────────────────────────────────────────────────────
  type Fabric = {
    id : Nat;
    fabricCode : Text;
    fabricName : Text;
    fabricType : Text;
    composition : Text;
    gsm : Float;
    width : Float;
    imageUrl : ?Text;
  };

  type ColourVariant = {
    id : Nat;
    fabricId : Nat;
    colourName : Text;
    pantoneCode : Text;
    hexValue : Text;
  };

  type Vendor = {
    id : Nat;
    colourVariantId : Nat;
    vendorName : Text;
    pricePerMeter : Float;
    moq : Nat;
    leadTimeDays : Nat;
  };

  type StyleEntry = {
    id : Nat;
    colourVariantId : Nat;
    styleNumber : Text;
    styleName : Text;
    season : Text;
    department : Text;
    zone : Text;
    imageUrl : ?Text;
  };

  type UserRecord = {
    principal : Principal;
    firstLoginTime : Int;
    lastLoginTime : Int;
    loginCount : Nat;
    isBlocked : Bool;
  };

  type RecordLoginResult = { #ok; #blocked };

  // ── Storage ────────────────────────────────────────────────────────────────
  let fabrics = Map.empty<Nat, Fabric>();
  let colourVariants = Map.empty<Nat, ColourVariant>();
  let vendors = Map.empty<Nat, Vendor>();
  let styleEntries = Map.empty<Nat, StyleEntry>();
  let userRecords = Map.empty<Principal, UserRecord>();
  let admins = Set.empty<Principal>();
  let editors = Set.empty<Principal>();

  var nextFabricId = 1;
  var nextColourVariantId = 1;
  var nextVendorId = 1;
  var nextStyleEntryId = 1;
  var appPin : Text = "1234";

  // ── Auth helpers ───────────────────────────────────────────────────────────
  func isAuthorized(caller : Principal) : Bool {
    admins.contains(caller) or editors.contains(caller);
  };

  // ── PIN management ─────────────────────────────────────────────────────────
  public func verifyPin(pin : Text) : async Bool {
    Text.equal(pin, appPin);
  };

  public shared ({ caller }) func setPin(newPin : Text) : async () {
    if (not admins.contains(caller)) {
      Runtime.trap("Unauthorized: admin only");
    };
    appPin := newPin;
  };

  // ── Editor role ────────────────────────────────────────────────────────────
  public shared ({ caller }) func promoteToEditor(target : Principal) : async () {
    if (not admins.contains(caller)) {
      Runtime.trap("Unauthorized: admin only");
    };
    editors.add(target);
  };

  public shared ({ caller }) func demoteFromEditor(target : Principal) : async () {
    if (not admins.contains(caller)) {
      Runtime.trap("Unauthorized: admin only");
    };
    editors.remove(target);
  };

  public query ({ caller }) func isEditor() : async Bool {
    editors.contains(caller);
  };

  // ── Admin & Login Tracking ─────────────────────────────────────────────────
  public shared ({ caller }) func recordLogin() : async RecordLoginResult {
    let now = Time.now();
    switch (userRecords.get(caller)) {
      case (?record) {
        if (record.isBlocked) return #blocked;
        let updated : UserRecord = {
          principal = caller;
          firstLoginTime = record.firstLoginTime;
          lastLoginTime = now;
          loginCount = record.loginCount + 1;
          isBlocked = false;
        };
        userRecords.add(caller, updated);
      };
      case null {
        let newRecord : UserRecord = {
          principal = caller;
          firstLoginTime = now;
          lastLoginTime = now;
          loginCount = 1;
          isBlocked = false;
        };
        userRecords.add(caller, newRecord);
        if (admins.size() == 0) {
          admins.add(caller);
        };
      };
    };
    #ok;
  };

  public query ({ caller }) func isAdmin() : async Bool {
    admins.contains(caller);
  };

  public query ({ caller }) func isBlocked() : async Bool {
    switch (userRecords.get(caller)) {
      case (?r) r.isBlocked;
      case null false;
    };
  };

  public query ({ caller }) func getLoginHistory() : async [UserRecord] {
    if (not admins.contains(caller)) {
      Runtime.trap("Unauthorized: admin only");
    };
    userRecords.values().toArray();
  };

  public shared ({ caller }) func blockUser(target : Principal) : async () {
    if (not admins.contains(caller)) {
      Runtime.trap("Unauthorized: admin only");
    };
    if (Principal.equal(caller, target)) {
      Runtime.trap("Cannot block yourself");
    };
    if (admins.contains(target)) {
      Runtime.trap("Cannot block another admin");
    };
    switch (userRecords.get(target)) {
      case (?r) {
        userRecords.add(target, { r with isBlocked = true });
      };
      case null {
        Runtime.trap("User not found");
      };
    };
  };

  public shared ({ caller }) func unblockUser(target : Principal) : async () {
    if (not admins.contains(caller)) {
      Runtime.trap("Unauthorized: admin only");
    };
    switch (userRecords.get(target)) {
      case (?r) {
        userRecords.add(target, { r with isBlocked = false });
      };
      case null {
        Runtime.trap("User not found");
      };
    };
  };

  // ── Fabric CRUD ────────────────────────────────────────────────────────────
  public shared ({ caller }) func createFabric(fabricCode : Text, fabricName : Text, fabricType : Text, composition : Text, gsm : Float, width : Float, imageUrl : ?Text) : async Nat {
    if (not isAuthorized(caller)) Runtime.trap("Unauthorized");
    let fabric : Fabric = {
      id = nextFabricId;
      fabricCode;
      fabricName;
      fabricType;
      composition;
      gsm;
      width;
      imageUrl;
    };
    fabrics.add(nextFabricId, fabric);
    nextFabricId += 1;
    fabric.id;
  };

  public query func getFabricById(id : Nat) : async Fabric {
    switch (fabrics.get(id)) {
      case (null) { Runtime.trap("Fabric does not exist") };
      case (?fabric) { fabric };
    };
  };

  public query func getAllFabrics() : async [Fabric] {
    fabrics.values().toArray();
  };

  public shared ({ caller }) func updateFabric(id : Nat, fabricCode : Text, fabricName : Text, fabricType : Text, composition : Text, gsm : Float, width : Float, imageUrl : ?Text) : async () {
    if (not isAuthorized(caller)) Runtime.trap("Unauthorized");
    switch (fabrics.get(id)) {
      case (null) { Runtime.trap("Tried to update non-existent fabric") };
      case (?_) {
        let updatedFabric : Fabric = {
          id;
          fabricCode;
          fabricName;
          fabricType;
          composition;
          gsm;
          width;
          imageUrl;
        };
        fabrics.add(id, updatedFabric);
      };
    };
  };

  public shared ({ caller }) func deleteFabric(id : Nat) : async () {
    if (not isAuthorized(caller)) Runtime.trap("Unauthorized");
    if (not fabrics.containsKey(id)) {
      Runtime.trap("Tried to delete non-existent fabric");
    };
    fabrics.remove(id);
  };

  // ── ColourVariant CRUD ─────────────────────────────────────────────────────
  public shared ({ caller }) func createColourVariant(fabricId : Nat, colourName : Text, pantoneCode : Text, hexValue : Text) : async Nat {
    if (not isAuthorized(caller)) Runtime.trap("Unauthorized");
    let colourVariant : ColourVariant = {
      id = nextColourVariantId;
      fabricId;
      colourName;
      pantoneCode;
      hexValue;
    };
    colourVariants.add(nextColourVariantId, colourVariant);
    nextColourVariantId += 1;
    colourVariant.id;
  };

  public query func getColourVariantsByFabric(fabricId : Nat) : async [ColourVariant] {
    colourVariants.values().toArray().filter(
      func(variant : ColourVariant) : Bool { variant.fabricId == fabricId }
    );
  };

  public query func getColourVariantById(id : Nat) : async ColourVariant {
    switch (colourVariants.get(id)) {
      case (null) { Runtime.trap("ColourVariant does not exist") };
      case (?cv) { cv };
    };
  };

  public query func getAllColourVariants() : async [ColourVariant] {
    colourVariants.values().toArray();
  };

  public shared ({ caller }) func updateColourVariant(id : Nat, colourName : Text, pantoneCode : Text, hexValue : Text) : async () {
    if (not isAuthorized(caller)) Runtime.trap("Unauthorized");
    switch (colourVariants.get(id)) {
      case (null) { Runtime.trap("ColourVariant does not exist") };
      case (?cv) {
        colourVariants.add(id, { cv with colourName; pantoneCode; hexValue });
      };
    };
  };

  public shared ({ caller }) func deleteColourVariant(id : Nat) : async () {
    if (not isAuthorized(caller)) Runtime.trap("Unauthorized");
    if (not colourVariants.containsKey(id)) {
      Runtime.trap("ColourVariant does not exist");
    };
    colourVariants.remove(id);
  };

  // ── Vendor CRUD ────────────────────────────────────────────────────────────
  public shared ({ caller }) func createVendor(colourVariantId : Nat, vendorName : Text, pricePerMeter : Float, moq : Nat, leadTimeDays : Nat) : async Nat {
    if (not isAuthorized(caller)) Runtime.trap("Unauthorized");
    let vendor : Vendor = {
      id = nextVendorId;
      colourVariantId;
      vendorName;
      pricePerMeter;
      moq;
      leadTimeDays;
    };
    vendors.add(nextVendorId, vendor);
    nextVendorId += 1;
    vendor.id;
  };

  public query func getVendorsByColourVariant(colourVariantId : Nat) : async [Vendor] {
    vendors.values().toArray().filter(
      func(v : Vendor) : Bool { v.colourVariantId == colourVariantId }
    );
  };

  public query func getAllVendors() : async [Vendor] {
    vendors.values().toArray();
  };

  public shared ({ caller }) func updateVendor(id : Nat, vendorName : Text, pricePerMeter : Float, moq : Nat, leadTimeDays : Nat) : async () {
    if (not isAuthorized(caller)) Runtime.trap("Unauthorized");
    switch (vendors.get(id)) {
      case (null) { Runtime.trap("Vendor does not exist") };
      case (?v) {
        vendors.add(id, { v with vendorName; pricePerMeter; moq; leadTimeDays });
      };
    };
  };

  public shared ({ caller }) func deleteVendor(id : Nat) : async () {
    if (not isAuthorized(caller)) Runtime.trap("Unauthorized");
    if (not vendors.containsKey(id)) {
      Runtime.trap("Vendor does not exist");
    };
    vendors.remove(id);
  };

  // ── StyleEntry CRUD ────────────────────────────────────────────────────────
  public shared ({ caller }) func createStyleEntry(colourVariantId : Nat, styleNumber : Text, styleName : Text, season : Text, department : Text, zone : Text, imageUrl : ?Text) : async Nat {
    if (not isAuthorized(caller)) Runtime.trap("Unauthorized");
    let entry : StyleEntry = {
      id = nextStyleEntryId;
      colourVariantId;
      styleNumber;
      styleName;
      season;
      department;
      zone;
      imageUrl;
    };
    styleEntries.add(nextStyleEntryId, entry);
    nextStyleEntryId += 1;
    entry.id;
  };

  public query func getStyleEntriesByColourVariant(colourVariantId : Nat) : async [StyleEntry] {
    styleEntries.values().toArray().filter(
      func(s : StyleEntry) : Bool { s.colourVariantId == colourVariantId }
    );
  };

  public query func getAllStyleEntries() : async [StyleEntry] {
    styleEntries.values().toArray();
  };

  public shared ({ caller }) func updateStyleEntry(id : Nat, styleNumber : Text, styleName : Text, season : Text, department : Text, zone : Text, imageUrl : ?Text) : async () {
    if (not isAuthorized(caller)) Runtime.trap("Unauthorized");
    switch (styleEntries.get(id)) {
      case (null) { Runtime.trap("StyleEntry does not exist") };
      case (?s) {
        styleEntries.add(id, { s with styleNumber; styleName; season; department; zone; imageUrl });
      };
    };
  };

  public shared ({ caller }) func deleteStyleEntry(id : Nat) : async () {
    if (not isAuthorized(caller)) Runtime.trap("Unauthorized");
    if (not styleEntries.containsKey(id)) {
      Runtime.trap("StyleEntry does not exist");
    };
    styleEntries.remove(id);
  };
};
