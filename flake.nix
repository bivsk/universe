{
  description = "Tari Universe, the beautifully simple mining app for Tari";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
		flake-utils.url = "github:numtide/flake-utils";
		rust-overlay = {
			url = "github:oxalica/rust-overlay";
			inputs.nixpkgs.follows = "nixpkgs";
		};
  };

	outputs =
		{
			self,
			nixpkgs,
			rust-overlay,
			flake-utils,
			...
		}:
		flake-utils.lib.eachDefaultSystem (
			system:
			let
				pkgs = import nixpkgs {
					inherit system;
					overlays = [ rust-overlay.overlays.default ];
				};
				toolchain = pkgs.rust-bin.stable.latest.default;
				rustPlatform = pkgs.makeRustPlatform {
					cargo = toolchain;
					rustc = toolchain;
				};

				pname = "tari-universe";
				rev = self.shortRev or self.dirtyShortRev or "dirty";
				date = self.lateModifiedDate or self.lastModified or "19700101";
				version = "0.9.8";
			in
			{
				packages = {
					tari-universe-unwrapped = pkgs.callPackage ./nix/tari-universe-unwrapped.nix {
						inherit
							pname
							version
							rev
							date
							rustPlatform
							;
					};
					#tari-universe = pkgs.callPackage ./nix/tari-universe.nix { inherit (self.packages.${system}) tari-universe-unwrapped; };
					default = self.packages.${system}.tari-universe-unwrapped;
				};

				# devShells = {
				# 	default = pkgs.callPackage ./nix/shell.nix { };
				# };

				formatter = pkgs.nixfmt-rfc-style;
			}
		)
		// {
			overlays = {
				default = self.overlays.tari-universe;
				tari-universe = _: prev: { inherit (self.packages.${prev.stdenv.system}) tari-universe tari-universe-unwrapped; };
			};
		};
}
