with deleted as (
    update "memberIdentities"
    set "deletedAt" = now(),
        "updatedAt" = now()
    where "deletedAt" is null
      and (
          (
              platform in ('meetings', 'cvent', 'tnc', 'committees')
              and type in ('email', 'username')
              and lower(value) in (
                  'cb-integration-bot@linuxfoundation.org',
                  'cdf-toc@lists.cd.foundation',
                  'cdm-tokenized-assets@lists.finos.org',
                  'dev-analytics-bot@linuxfoundation.org',
                  'doe@example.com',
                  'formation@lists.neonephos.org',
                  'groupsio-analytics-bot@linuxfoundation.org',
                  'groupsio-automation-bot@linuxfoundation.org',
                  'ishu@example.com',
                  'jenkins@cd.foundation',
                  'jenkins-zoom-users@googlegroups.com',
                  'johndoe.train@example.com',
                  'jpf-okteto-kubecon-eu-2023-533434511717@googlegroups.com',
                  'kernelci@lists.linux.dev',
                  'kernelci-members@groups.io',
                  'kernelci-tsc@groups.io',
                  'kubernetes-sig-network-leads@googlegroups.com',
                  'main@lists.openchainproject.org',
                  'martin.xu@example.com',
                  'meeting1@seidengroup.com',
                  'meetings@dpdk.org',
                  'meetings@lists.magmacore.org',
                  'meetings@openjsf.org',
                  'meetings@prestodb.io',
                  'meetings@socalblender.org',
                  'noreply@github.com',
                  'noreply@pushfeedback.com',
                  'noreply@zza.hu',
                  'notifications@lists.overturemaps.org',
                  'opengris@lists.finos.org',
                  'operator-framework@googlegroups.com',
                  'portal_helps@lists.onap.org',
                  'rise-system-libraries-wg@lists.riseproject.dev',
                  'sonic-outreach@lists.sonicfoundation.dev',
                  'student1@example.com',
                  'test@example.com',
                  'wg-linux-distros@lists.openmainframeproject.org',
                  'wpadmin@example.com',
                  'zoom0@hyperledger.org',
                  'zoom2@hyperledger.org',
                  'zoom2@lfai.foundation',
                  'zoom2@r-consortium.org',
                  'zoom3@hyperledger.org',
                  'zoom8@lfaidata.foundation',
                  'zoom-admin@nephio.org',
                  'zoom_anari@lists.khronos.org',
                  'zoom@ccbny.com',
                  'zoom@dent.dev',
                  'zoom@district5030.org',
                  'zoom@elisa.tech',
                  'zoom@hyperledger.org',
                  'zoom-jl@fd.io',
                  'zoom@lfai.foundation',
                  'zoom@longnowboston.org',
                  'zoom-nodejs@openjsf.org',
                  'zoom@openidl.org',
                  'zoom@openids.io',
                  'zoom@openwallet.foundation',
                  'zoom@r-consortium.org',
                  'zoom+sig@riscv.org'
              )
          )
          or (platform = 'cvent' and type = 'username' and lower(value) in ('na', 'none', 'null'))
          or (platform = 'lfid' and type = 'username' and lower(value) = 'undefined')
      )
    returning "memberId"
)
update members
set "updatedAt" = now()
where id in (select "memberId" from deleted);
