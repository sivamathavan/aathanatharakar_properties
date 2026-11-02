import java.util.Properties

plugins {
    id("com.android.application")
}

// Everything that changes between local testing and the Play Store build comes
// from gradle.properties (or -P on the command line), so nothing is hard-coded.
fun prop(name: String): String = (findProperty(name) as String?)?.trim().orEmpty()

val host = prop("proppageHost")
val scheme = prop("proppageScheme").ifEmpty { "https" }
val siteOrigin = "$scheme://$host"

// Upload key for Google Play, kept outside git (see android/README.md).
val keystoreFile = rootProject.file("keystore.properties")
val keystore = Properties().apply { if (keystoreFile.exists()) keystoreFile.inputStream().use { load(it) } }

android {
    namespace = "com.rturox.proppage"
    compileSdk = 36

    defaultConfig {
        applicationId = prop("proppageAppId")
        minSdk = 24
        targetSdk = 36
        versionCode = prop("proppageVersionCode").toInt()
        versionName = prop("proppageVersionName")

        // Links on the site open in the app. Local http test builds claim no links: an
        // unverified http site would bounce every redirect back into the app.
        manifestPlaceholders["hostName"] = if (scheme == "https") host.substringBefore(":") else "local-test.invalid"
        manifestPlaceholders["launchUrl"] = "$siteOrigin/dashboard"
        manifestPlaceholders["linkScheme"] = scheme
        resValue("string", "app_name", prop("proppageAppName"))
        // Must match the site's /.well-known/assetlinks.json for full-screen mode.
        resValue(
            "string",
            "asset_statements",
            """[{"relation":["delegate_permission/common.handle_all_urls"],"target":{"namespace":"web","site":"$siteOrigin"}}]""",
        )
    }

    buildFeatures {
        resValues = true
    }

    signingConfigs {
        if (keystore.isNotEmpty()) {
            create("upload") {
                storeFile = file(keystore.getProperty("storeFile"))
                storePassword = keystore.getProperty("storePassword")
                keyAlias = keystore.getProperty("keyAlias")
                keyPassword = keystore.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            if (keystore.isNotEmpty()) signingConfig = signingConfigs.getByName("upload")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.7.4")
}

// Refuse to build a Play Store bundle that still points at the placeholder domain.
tasks.matching { it.name == "bundleRelease" || it.name == "assembleRelease" }.configureEach {
    doFirst {
        check(host.isNotEmpty() && !host.startsWith("REPLACE")) { "Set proppageHost in android/gradle.properties to your real domain first." }
        check(scheme == "https") { "Play Store builds must use https." }
        check(keystore.isNotEmpty()) { "Create android/keystore.properties first (see android/README.md)." }
    }
}
