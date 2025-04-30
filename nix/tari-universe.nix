{ config, lib, pkgs, callPackage, ... }:

{
  tari-universe = callPackage ./default.nix {};
}
