/** @type {import('@nciyuan/pam-generate').CodegenConfig} */
export default {
  services: {
    AuthService: {
      input: '../pam-idl/idl/auth/v1/service.thrift',
      outDir: 'src/api/generated/auth',
    },
    GamePlatformService: {
      input: '../pam-idl/idl/game_platform/v1/service.thrift',
      outDir: 'src/api/generated/game-platform',
    },
    GameAdminService: {
      input: '../pam-idl/idl/game_admin/v1/service.thrift',
      outDir: 'src/api/generated/game-admin',
    },
  },
  generate: {
    int64: 'string',
  },
};
