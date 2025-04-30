{
  rustPlatform,
  pname,
  version ? "git",
  rev ? "unknown",
  date ? "19700101",
  lib,

  stdenv,
  pkgs,
}:
let
  src = lib.fileset.toSource {
    root = ../src-tauri;
    fileset = lib.fileset.unions [
      (lib.fileset.fromSource ../src-tauri)
    ];
  };
in

rustPlatform.buildRustPackage {
  inherit version src;
  pname = "${pname}-unwrapped";

  cargoLock = {
    lockFile = "${src}/Cargo.lock";
    outputHashes = {
      "fix-path-env-0.0.0" = "sha256-SHJc86sbK2fA48vkVjUpvC5FQoBOno3ylUV5J1b4dAk=";
      "minotari_app_grpc-1.16.0-pre.0" = "sha256-EgLfut07dV43Qns6vVje1OnxbOD7MO+WoRKNY6KUQ0o=";
      "monero-address-creator-0.1.0" = "sha256-a9CDlE1/DOgmgPtYxj3cHTB75khRpFKewohVKQLAd8c=";
      "psp-0.1.0" = "sha256-MEDvUpCsnRCsh5fcWJwVp6jewx9XjUvD50NLKQrJb4c=";
    };
  };

  useFetchCargoVendor = true;

  env = {
    OPENSSL_NO_VENDOR = 1;
  };

  nativeBuildInputs = with pkgs; [
    pkg-config
    cmake
    protobuf
  ];

  buildInputs = with pkgs; [
    libappindicator-gtk3
    librsvg
    openssl
    webkitgtk_4_1
  ];

  # buildInputs = [
  #   openssl
  #   libsoup
  #   webkitgtk_4_1
  # ];
  #
  meta = {
    description = "A mining app for Tari";
    homepage = "https://tari.com";
    license = lib.licenses.mit;
    mainProgram = "tari-universe";
  };
}
